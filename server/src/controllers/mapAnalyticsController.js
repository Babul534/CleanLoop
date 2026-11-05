import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';

const VALID_STATUSES = [
  'pending',
  'under_review',
  'assigned',
  'in_progress',
  'awaiting_verification',
  'resolved',
  'rejected',
  'reopen_requested'
];

const VALID_CATEGORIES = [
  'plastic',
  'organic',
  'construction',
  'household',
  'industrial',
  'mixed',
  'other'
];

const VALID_PRIORITIES = ['low', 'medium', 'high'];

// Default metropolitan centroid (New Delhi civic center)
const DEFAULT_CENTER = [28.6139, 77.2090];

/**
 * Validates coordinate pair safely: [lng, lat]
 * Longitude must be between -180 and 180, Latitude between -90 and 90
 */
const isValidCoordinatePair = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lng, lat] = coords;
  if (typeof lng !== 'number' || typeof lat !== 'number') return false;
  if (Number.isNaN(lng) || Number.isNaN(lat)) return false;
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

// -----------------------------------------------------------------------------
// 1. GET MAP COMPLAINTS (WITH FILTERS & HEATMAP INTENSITY VECTORS)
// -----------------------------------------------------------------------------

export const getAdminMapComplaints = async (req, res) => {
  try {
    const { status, category, priority, startDate, endDate } = req.query;

    // Base query enforcing strict GeoJSON validity
    const query = {
      'location.coordinates': { $size: 2 },
      'location.coordinates.0': { $gte: -180, $lte: 180 },
      'location.coordinates.1': { $gte: -90, $lte: 90 }
    };

    if (status && status !== 'all' && VALID_STATUSES.includes(status)) {
      query.status = status;
    }

    if (category && category !== 'all' && VALID_CATEGORIES.includes(category.toLowerCase())) {
      query.category = category.toLowerCase();
    }

    if (priority && priority !== 'all' && VALID_PRIORITIES.includes(priority.toLowerCase())) {
      query.priority = priority.toLowerCase();
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const rawComplaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name')
      .populate('assignedCollector', 'name phone availability')
      .select('complaintCode category priority reportedPriority status location description images createdAt user assignedCollector')
      .lean();

    // Secondary runtime filter to guarantee coordinate sanity
    const validComplaints = [];
    const heatPoints = [];

    let totalLat = 0;
    let totalLng = 0;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const c of rawComplaints) {
      const coords = c.location?.coordinates;
      if (!isValidCoordinatePair(coords)) {
        continue; // Safely skip invalid or corrupt geographic data
      }

      const [lng, lat] = coords;
      totalLat += lat;
      totalLng += lng;

      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;

      // Calculate intensity weight for density heatmap:
      // High priority = 1.0, Medium = 0.65, Low = 0.35
      // Active states add weight over resolved states
      let intensity = c.priority === 'high' ? 1.0 : c.priority === 'medium' ? 0.65 : 0.35;
      if (c.status === 'resolved') intensity *= 0.5;

      heatPoints.push([lat, lng, Number(intensity.toFixed(2))]);

      validComplaints.push({
        _id: c._id,
        complaintCode: c.complaintCode,
        category: c.category,
        priority: c.priority || 'medium',
        reportedPriority: c.reportedPriority || 'medium',
        status: c.status,
        description: c.description,
        images: c.images || [],
        location: c.location,
        coordinates: [lng, lat],
        lat,
        lng,
        address: c.location?.address?.formattedAddress || '',
        landmark: c.location?.address?.landmark || '',
        createdAt: c.createdAt,
        user: c.user ? { name: c.user.name } : null,
        assignedCollector: c.assignedCollector
          ? {
              name: c.assignedCollector.name,
              phone: c.assignedCollector.phone,
              availability: c.assignedCollector.availability
            }
          : null
      });
    }

    const count = validComplaints.length;
    const center = count > 0 ? [Number((totalLat / count).toFixed(6)), Number((totalLng / count).toFixed(6))] : DEFAULT_CENTER;
    const bounds = count > 0 ? { minLat, maxLat, minLng, maxLng } : null;

    return res.status(200).json({
      success: true,
      total: count,
      complaints: validComplaints,
      heatPoints,
      center,
      bounds
    });
  } catch (error) {
    console.error('[Admin Map Complaints Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve spatial map complaint data.'
    });
  }
};

// -----------------------------------------------------------------------------
// 2. GET GEOGRAPHIC ANALYTICS & HOTSPOT CLUSTERING
// -----------------------------------------------------------------------------

export const getAdminMapAnalytics = async (req, res) => {
  try {
    const { status, category, priority, startDate, endDate } = req.query;

    const matchQuery = {
      'location.coordinates': { $size: 2 },
      'location.coordinates.0': { $gte: -180, $lte: 180 },
      'location.coordinates.1': { $gte: -90, $lte: 90 }
    };

    if (status && status !== 'all' && VALID_STATUSES.includes(status)) {
      matchQuery.status = status;
    }

    if (category && category !== 'all' && VALID_CATEGORIES.includes(category.toLowerCase())) {
      matchQuery.category = category.toLowerCase();
    }

    if (priority && priority !== 'all' && VALID_PRIORITIES.includes(priority.toLowerCase())) {
      matchQuery.priority = priority.toLowerCase();
    }

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Parallel Aggregation Pipelines
    const [
      hotspotAggregation,
      categoryDistribution,
      statusDistribution,
      priorityDistribution,
      totalMappedComplaints
    ] = await Promise.all([
      // 1. Hotspot spatial clustering by rounded coordinates (~1.1 km grid)
      Complaint.aggregate([
        { $match: matchQuery },
        {
          $project: {
            complaintCode: 1,
            category: 1,
            priority: 1,
            status: 1,
            address: '$location.address.formattedAddress',
            landmark: '$location.address.landmark',
            lng: { $arrayElemAt: ['$location.coordinates', 0] },
            lat: { $arrayElemAt: ['$location.coordinates', 1] },
            gridLng: {
              $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 2]
            },
            gridLat: {
              $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 2]
            }
          }
        },
        {
          $group: {
            _id: { gridLat: '$gridLat', gridLng: '$gridLng' },
            count: { $sum: 1 },
            highPriorityCount: {
              $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
            },
            pendingCount: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$status',
                      ['pending', 'under_review', 'assigned', 'in_progress', 'awaiting_verification']
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            resolvedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            },
            categories: { $push: '$category' },
            sampleAddress: { $first: '$address' },
            sampleLandmark: { $first: '$landmark' },
            avgLat: { $avg: '$lat' },
            avgLng: { $avg: '$lng' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // 2. Category distribution
      Complaint.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // 3. Status distribution
      Complaint.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // 4. Priority distribution
      Complaint.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // 5. Total mapped complaints
      Complaint.countDocuments(matchQuery)
    ]);

    // Format Hotspots with dominant category & severity score
    const formattedHotspots = hotspotAggregation.map((h, index) => {
      // Find mode category
      const catCount = {};
      let topCategory = 'mixed';
      let maxCatCount = 0;
      for (const cat of h.categories) {
        catCount[cat] = (catCount[cat] || 0) + 1;
        if (catCount[cat] > maxCatCount) {
          maxCatCount = catCount[cat];
          topCategory = cat;
        }
      }

      // Severity index: weighted high priority + pending workload
      const severityScore = Number(
        (h.highPriorityCount * 2.5 + h.pendingCount * 1.5).toFixed(1)
      );

      const areaTitle =
        h.sampleAddress ||
        h.sampleLandmark ||
        `Municipal Sector Zone [${h._id.gridLat.toFixed(2)}, ${h._id.gridLng.toFixed(2)}]`;

      return {
        rank: index + 1,
        lat: Number(h.avgLat.toFixed(6)),
        lng: Number(h.avgLng.toFixed(6)),
        count: h.count,
        highPriorityCount: h.highPriorityCount,
        pendingCount: h.pendingCount,
        resolvedCount: h.resolvedCount,
        topCategory,
        severityScore,
        locationName: areaTitle
      };
    });

    // Compute distribution percentages
    const totalCountSafe = totalMappedComplaints || 1;

    const formattedCategories = categoryDistribution.map((item) => ({
      category: item._id,
      count: item.count,
      percentage: Number(((item.count / totalCountSafe) * 100).toFixed(1))
    }));

    const formattedStatuses = statusDistribution.map((item) => ({
      status: item._id,
      count: item.count,
      percentage: Number(((item.count / totalCountSafe) * 100).toFixed(1))
    }));

    const formattedPriorities = priorityDistribution.map((item) => ({
      priority: item._id,
      count: item.count,
      percentage: Number(((item.count / totalCountSafe) * 100).toFixed(1))
    }));

    // Metrics summary
    const criticalHotspotsCount = formattedHotspots.filter(
      (h) => h.highPriorityCount >= 2 || h.count >= 3
    ).length;

    const pendingRemediations = statusDistribution
      .filter((s) => ['pending', 'under_review', 'assigned', 'in_progress', 'awaiting_verification'].includes(s._id))
      .reduce((sum, s) => sum + s.count, 0);

    const resolvedRemediations = statusDistribution
      .filter((s) => s._id === 'resolved')
      .reduce((sum, s) => sum + s.count, 0);

    return res.status(200).json({
      success: true,
      analytics: {
        metrics: {
          totalMappedComplaints,
          criticalHotspotsCount,
          pendingRemediations,
          resolvedRemediations,
          topHotspot: formattedHotspots[0] || null
        },
        hotspots: formattedHotspots,
        categoryDistribution: formattedCategories,
        statusDistribution: formattedStatuses,
        priorityDistribution: formattedPriorities
      }
    });
  } catch (error) {
    console.error('[Admin Map Analytics Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to aggregate spatial analytics and hotspot clusters.'
    });
  }
};

export default {
  getAdminMapComplaints,
  getAdminMapAnalytics
};

