import mongoose from 'mongoose';
import {
  User,
  Complaint,
  Assignment,
  Notification,
  Feedback,
  PointsTransaction,
  ActivityLog
} from '../models/index.js';

/**
 * Phase 2 Final Deep-Dive Verification Script
 * Validates all 7 Mongoose models, ObjectId references, required fields,
 * enum restrictions, GeoJSON specifications, 2dsphere index, unique indexes,
 * partial filter expressions, and index cleanliness.
 */

const results = {
  passed: 0,
  failed: 0,
  details: []
};

const recordTest = (category, description, success, details = '') => {
  if (success) {
    results.passed++;
    results.details.push({ status: 'PASS', category, description });
    console.log(`  [PASS] [${category}] ${description}`);
  } else {
    results.failed++;
    results.details.push({ status: 'FAIL', category, description, details });
    console.error(`  [FAIL] [${category}] ${description} -> ${details}`);
  }
};

export const runPhase2Verification = async () => {
  console.log('================================================================');
  console.log(' CLEANLOOP — PHASE 2 FINAL MODEL & ARCHITECTURE VERIFICATION');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // 1. ALL MODELS LOAD WITHOUT ERRORS
  // -------------------------------------------------------------------------
  console.log('1. Model Initialization:');
  const models = [
    { name: 'User', model: User },
    { name: 'Complaint', model: Complaint },
    { name: 'Assignment', model: Assignment },
    { name: 'Notification', model: Notification },
    { name: 'Feedback', model: Feedback },
    { name: 'PointsTransaction', model: PointsTransaction },
    { name: 'ActivityLog', model: ActivityLog }
  ];

  for (const { name, model } of models) {
    const isModelValid = Boolean(model && model.prototype instanceof mongoose.Model);
    recordTest('Model Loading', `Model ${name} compiled and registered in Mongoose`, isModelValid);
  }

  // -------------------------------------------------------------------------
  // 2. OBJECTID REFERENCES POINT TO CORRECT MODELS
  // -------------------------------------------------------------------------
  console.log('\n2. ObjectId References & Relationships:');

  const refChecks = [
    { model: Complaint, path: 'user', expectedRef: 'User' },
    { model: Complaint, path: 'assignedCollector', expectedRef: 'User' },
    { model: Complaint, path: 'duplicateOf', expectedRef: 'Complaint' },
    { model: Assignment, path: 'complaint', expectedRef: 'Complaint' },
    { model: Assignment, path: 'collector', expectedRef: 'User' },
    { model: Assignment, path: 'assignedBy', expectedRef: 'User' },
    { model: Notification, path: 'user', expectedRef: 'User' },
    { model: Notification, path: 'relatedComplaint', expectedRef: 'Complaint' },
    { model: Feedback, path: 'complaint', expectedRef: 'Complaint' },
    { model: Feedback, path: 'user', expectedRef: 'User' },
    { model: PointsTransaction, path: 'user', expectedRef: 'User' },
    { model: PointsTransaction, path: 'complaint', expectedRef: 'Complaint' },
    { model: ActivityLog, path: 'actor', expectedRef: 'User' }
  ];

  for (const check of refChecks) {
    const schemaType = check.model.schema.path(check.path);
    const actualRef = schemaType ? schemaType.options.ref : null;
    const isCorrect = actualRef === check.expectedRef;
    recordTest(
      'ObjectId Reference',
      `${check.model.modelName}.${check.path} -> ref: '${check.expectedRef}'`,
      isCorrect,
      `Got: ${actualRef}`
    );
  }

  // Check subdocument references
  const statusHistoryChangedBy = Complaint.schema.path('statusHistory').schema.path('changedBy').options.ref;
  recordTest(
    'Subdoc Reference',
    `Complaint.statusHistory.changedBy -> ref: 'User'`,
    statusHistoryChangedBy === 'User',
    `Got: ${statusHistoryChangedBy}`
  );

  const reopenReviewedBy = Complaint.schema.path('reopenRequest').schema.path('reviewedBy').options.ref;
  recordTest(
    'Subdoc Reference',
    `Complaint.reopenRequest.reviewedBy -> ref: 'User'`,
    reopenReviewedBy === 'User',
    `Got: ${reopenReviewedBy}`
  );

  // -------------------------------------------------------------------------
  // 3. REQUIRED FIELD VALIDATION
  // -------------------------------------------------------------------------
  console.log('\n3. Required Field Validation:');

  const dummyId = new mongoose.Types.ObjectId();

  // User missing fields
  try {
    await new User({}).validate();
    recordTest('Required Field', 'User requires name, email, passwordHash', false, 'Passed without required fields');
  } catch (err) {
    const hasName = Boolean(err.errors?.name);
    const hasEmail = Boolean(err.errors?.email);
    const hasPassword = Boolean(err.errors?.passwordHash);
    recordTest('Required Field', 'User rejects missing name', hasName);
    recordTest('Required Field', 'User rejects missing email', hasEmail);
    recordTest('Required Field', 'User rejects missing passwordHash', hasPassword);
  }

  // Complaint missing fields
  try {
    await new Complaint({}).validate();
    recordTest('Required Field', 'Complaint requires user, description, category, location', false);
  } catch (err) {
    const hasUser = Boolean(err.errors?.user);
    const hasDesc = Boolean(err.errors?.description);
    const hasCat = Boolean(err.errors?.category);
    const hasLoc = Boolean(err.errors?.['location.coordinates']);
    recordTest('Required Field', 'Complaint rejects missing user', hasUser);
    recordTest('Required Field', 'Complaint rejects missing description', hasDesc);
    recordTest('Required Field', 'Complaint rejects missing category', hasCat);
    recordTest('Required Field', 'Complaint rejects missing location coordinates', hasLoc);
  }

  // Assignment missing fields
  try {
    await new Assignment({}).validate();
    recordTest('Required Field', 'Assignment requires complaint, collector, assignedBy', false);
  } catch (err) {
    const hasComplaint = Boolean(err.errors?.complaint);
    const hasCollector = Boolean(err.errors?.collector);
    const hasAssignedBy = Boolean(err.errors?.assignedBy);
    recordTest('Required Field', 'Assignment rejects missing complaint', hasComplaint);
    recordTest('Required Field', 'Assignment rejects missing collector', hasCollector);
    recordTest('Required Field', 'Assignment rejects missing assignedBy', hasAssignedBy);
  }

  // Feedback missing fields
  try {
    await new Feedback({}).validate();
    recordTest('Required Field', 'Feedback requires complaint, user, rating', false);
  } catch (err) {
    const hasComp = Boolean(err.errors?.complaint);
    const hasUsr = Boolean(err.errors?.user);
    const hasRat = Boolean(err.errors?.rating);
    recordTest('Required Field', 'Feedback rejects missing complaint', hasComp);
    recordTest('Required Field', 'Feedback rejects missing user', hasUsr);
    recordTest('Required Field', 'Feedback rejects missing rating', hasRat);
  }

  // PointsTransaction missing fields
  try {
    await new PointsTransaction({}).validate();
    recordTest('Required Field', 'PointsTransaction requires user, points, type, reason', false);
  } catch (err) {
    const hasUser = Boolean(err.errors?.user);
    const hasPoints = Boolean(err.errors?.points);
    const hasType = Boolean(err.errors?.type);
    const hasReason = Boolean(err.errors?.reason);
    recordTest('Required Field', 'PointsTransaction rejects missing user', hasUser);
    recordTest('Required Field', 'PointsTransaction rejects missing points', hasPoints);
    recordTest('Required Field', 'PointsTransaction rejects missing type', hasType);
    recordTest('Required Field', 'PointsTransaction rejects missing reason', hasReason);
  }

  // ActivityLog missing fields
  try {
    await new ActivityLog({}).validate();
    recordTest('Required Field', 'ActivityLog requires action, entityType', false);
  } catch (err) {
    const hasAction = Boolean(err.errors?.action);
    const hasEntity = Boolean(err.errors?.entityType);
    recordTest('Required Field', 'ActivityLog rejects missing action', hasAction);
    recordTest('Required Field', 'ActivityLog rejects missing entityType', hasEntity);
  }

  // -------------------------------------------------------------------------
  // 4. ENUM RESTRICTIONS
  // -------------------------------------------------------------------------
  console.log('\n4. Enum Restrictions:');

  const enumChecks = [
    {
      name: 'User.role',
      create: () => new User({ name: 'T', email: 't@e.co', passwordHash: 'h', role: 'INVALID' }),
      field: 'role',
      allowed: ['user', 'admin', 'collector']
    },
    {
      name: 'User.accountStatus',
      create: () => new User({ name: 'T', email: 't@e.co', passwordHash: 'h', accountStatus: 'INVALID' }),
      field: 'accountStatus',
      allowed: ['active', 'suspended']
    },
    {
      name: 'User.availability',
      create: () => new User({ name: 'T', email: 't@e.co', passwordHash: 'h', availability: 'INVALID' }),
      field: 'availability',
      allowed: ['available', 'busy', 'unavailable']
    },
    {
      name: 'Complaint.category',
      create: () =>
        new Complaint({
          user: dummyId,
          description: 'Valid description test',
          category: 'INVALID_CATEGORY',
          location: { type: 'Point', coordinates: [77.2, 28.6] }
        }),
      field: 'category',
      allowed: ['plastic', 'organic', 'construction', 'household', 'industrial', 'mixed', 'other']
    },
    {
      name: 'Complaint.priority',
      create: () =>
        new Complaint({
          user: dummyId,
          description: 'Valid description test',
          category: 'mixed',
          priority: 'INVALID_PRIORITY',
          location: { type: 'Point', coordinates: [77.2, 28.6] }
        }),
      field: 'priority',
      allowed: ['low', 'medium', 'high']
    },
    {
      name: 'Complaint.status',
      create: () =>
        new Complaint({
          user: dummyId,
          description: 'Valid description test',
          category: 'mixed',
          status: 'INVALID_STATUS',
          location: { type: 'Point', coordinates: [77.2, 28.6] }
        }),
      field: 'status',
      allowed: [
        'pending',
        'under_review',
        'assigned',
        'in_progress',
        'awaiting_verification',
        'resolved',
        'rejected',
        'reopen_requested'
      ]
    },
    {
      name: 'Assignment.status',
      create: () =>
        new Assignment({
          complaint: dummyId,
          collector: dummyId,
          assignedBy: dummyId,
          status: 'INVALID_STATUS'
        }),
      field: 'status',
      allowed: ['assigned', 'accepted', 'in_progress', 'submitted_for_verification', 'verified', 'reassigned', 'cancelled']
    },
    {
      name: 'Notification.type',
      create: () =>
        new Notification({
          user: dummyId,
          title: 'Title',
          message: 'Message',
          type: 'INVALID_NOTIFICATION'
        }),
      field: 'type',
      allowed: ['complaint_update', 'assignment', 'resolution', 'reopen_request', 'reward', 'system']
    },
    {
      name: 'PointsTransaction.type',
      create: () =>
        new PointsTransaction({
          user: dummyId,
          points: 10,
          type: 'INVALID_TYPE',
          reason: 'Reason'
        }),
      field: 'type',
      allowed: ['complaint_resolved', 'admin_adjustment']
    },
    {
      name: 'ActivityLog.entityType',
      create: () =>
        new ActivityLog({
          action: 'ACTION',
          entityType: 'INVALID_ENTITY'
        }),
      field: 'entityType',
      allowed: ['User', 'Complaint', 'Assignment', 'Feedback', 'PointsTransaction']
    }
  ];

  for (const check of enumChecks) {
    try {
      const doc = check.create();
      await doc.validate();
      recordTest('Enum Restriction', `${check.name} rejects unauthorized value`, false);
    } catch (err) {
      const hasError = Boolean(err.errors?.[check.field]);
      recordTest(
        'Enum Restriction',
        `${check.name} restricts values to [${check.allowed.join(', ')}]`,
        hasError,
        `Error keys: ${Object.keys(err.errors || {})}`
      );
    }
  }

  // -------------------------------------------------------------------------
  // 5. GEOJSON COORDINATES [LONGITUDE, LATITUDE] VALIDATION
  // -------------------------------------------------------------------------
  console.log('\n5. GeoJSON Format & Coordinates Bounds:');

  // Valid [longitude, latitude]
  try {
    const validLoc = new Complaint({
      user: dummyId,
      description: 'Coordinates test with valid bounds',
      category: 'plastic',
      location: {
        type: 'Point',
        coordinates: [77.209, 28.6139] // New Delhi: lng ~ 77.2, lat ~ 28.6
      }
    });
    await validLoc.validate();
    recordTest('GeoJSON Coordinates', 'Accepts valid coordinates [77.2090, 28.6139] in [lng, lat] order', true);
  } catch (err) {
    recordTest('GeoJSON Coordinates', 'Accepts valid coordinates in [lng, lat] order', false, err.message);
  }

  // Longitude > 180
  try {
    const invalidLng = new Complaint({
      user: dummyId,
      description: 'Coordinates test invalid lng',
      category: 'plastic',
      location: {
        type: 'Point',
        coordinates: [181.0, 28.6]
      }
    });
    await invalidLng.validate();
    recordTest('GeoJSON Bounds', 'Rejects longitude > 180', false);
  } catch (err) {
    recordTest('GeoJSON Bounds', 'Rejects longitude > 180', Boolean(err.errors?.['location.coordinates']));
  }

  // Longitude < -180
  try {
    const invalidLngNeg = new Complaint({
      user: dummyId,
      description: 'Coordinates test invalid lng negative',
      category: 'plastic',
      location: {
        type: 'Point',
        coordinates: [-181.0, 28.6]
      }
    });
    await invalidLngNeg.validate();
    recordTest('GeoJSON Bounds', 'Rejects longitude < -180', false);
  } catch (err) {
    recordTest('GeoJSON Bounds', 'Rejects longitude < -180', Boolean(err.errors?.['location.coordinates']));
  }

  // Latitude > 90
  try {
    const invalidLat = new Complaint({
      user: dummyId,
      description: 'Coordinates test invalid lat',
      category: 'plastic',
      location: {
        type: 'Point',
        coordinates: [77.2, 91.0]
      }
    });
    await invalidLat.validate();
    recordTest('GeoJSON Bounds', 'Rejects latitude > 90', false);
  } catch (err) {
    recordTest('GeoJSON Bounds', 'Rejects latitude > 90', Boolean(err.errors?.['location.coordinates']));
  }

  // Latitude < -90
  try {
    const invalidLatNeg = new Complaint({
      user: dummyId,
      description: 'Coordinates test invalid lat negative',
      category: 'plastic',
      location: {
        type: 'Point',
        coordinates: [77.2, -91.0]
      }
    });
    await invalidLatNeg.validate();
    recordTest('GeoJSON Bounds', 'Rejects latitude < -90', false);
  } catch (err) {
    recordTest('GeoJSON Bounds', 'Rejects latitude < -90', Boolean(err.errors?.['location.coordinates']));
  }

  // Single number in coordinates array
  try {
    const invalidLength = new Complaint({
      user: dummyId,
      description: 'Coordinates test single number',
      category: 'plastic',
      location: {
        type: 'Point',
        coordinates: [77.2]
      }
    });
    await invalidLength.validate();
    recordTest('GeoJSON Length', 'Rejects coordinates array length !== 2', false);
  } catch (err) {
    recordTest('GeoJSON Length', 'Rejects coordinates array length !== 2', Boolean(err.errors?.['location.coordinates']));
  }

  // -------------------------------------------------------------------------
  // 6. 2DSPHERE INDEX VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n6. Geospatial 2dsphere Index:');

  const complaintIndexes = Complaint.schema.indexes();
  const has2dSphere = complaintIndexes.some(([indexFields]) => indexFields.location === '2dsphere');
  recordTest('2dsphere Index', "Complaint schema contains { location: '2dsphere' } index", has2dSphere);

  // -------------------------------------------------------------------------
  // 7. UNIQUE INDEXES VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n7. Unique & Compound Unique Indexes:');

  // User.email
  const userEmailUnique = Boolean(User.schema.path('email').options.unique);
  recordTest('Unique Index', 'User.email has unique constraint enabled', userEmailUnique);

  // Complaint.complaintCode
  const complaintCodeUnique = Boolean(Complaint.schema.path('complaintCode').options.unique);
  recordTest('Unique Index', 'Complaint.complaintCode has unique constraint enabled', complaintCodeUnique);

  // Feedback compound unique index
  const feedbackIndexes = Feedback.schema.indexes();
  const hasFeedbackUnique = feedbackIndexes.some(
    ([fields, opts]) => fields.complaint === 1 && fields.user === 1 && opts?.unique === true
  );
  recordTest('Compound Unique Index', 'Feedback has unique compound index on { complaint: 1, user: 1 }', hasFeedbackUnique);

  // -------------------------------------------------------------------------
  // 8. POINTSTRANSACTION UNIQUE REWARD CONSTRAINT
  // -------------------------------------------------------------------------
  console.log('\n8. PointsTransaction Unique Reward Constraint:');

  const ptIndexes = PointsTransaction.schema.indexes();
  const rewardConstraint = ptIndexes.find(
    ([fields, opts]) => fields.complaint === 1 && fields.type === 1 && opts?.unique === true
  );

  const hasRewardConstraint = Boolean(rewardConstraint);
  const partialFilter = rewardConstraint ? rewardConstraint[1]?.partialFilterExpression : null;
  const hasCorrectPartialFilter =
    partialFilter?.type === 'complaint_resolved' &&
    partialFilter?.complaint?.$exists === true &&
    partialFilter?.complaint?.$type === 'objectId';

  recordTest(
    'Reward Index',
    'PointsTransaction has unique index on { complaint: 1, type: 1 }',
    hasRewardConstraint
  );
  recordTest(
    'Partial Filter',
    "Unique index uses partialFilterExpression for type='complaint_resolved' and complaint existence",
    hasCorrectPartialFilter,
    `Actual: ${JSON.stringify(partialFilter)}`
  );

  // IdempotencyKey unique partial index
  const idempotencyConstraint = ptIndexes.find(
    ([fields, opts]) => fields.idempotencyKey === 1 && opts?.unique === true
  );
  recordTest(
    'Idempotency Index',
    'PointsTransaction has unique partial index on { idempotencyKey: 1 }',
    Boolean(idempotencyConstraint)
  );

  // -------------------------------------------------------------------------
  // 9. NO DUPLICATE OR UNNECESSARY INDEXES
  // -------------------------------------------------------------------------
  console.log('\n9. Index Redundancy & Cleanliness Audit:');

  const checkIndexCleanliness = (model) => {
    const rawIndexes = model.schema.indexes();
    const seenIndexKeys = new Set();
    let hasDuplicate = false;

    for (const [fields] of rawIndexes) {
      const serialized = JSON.stringify(fields);
      if (seenIndexKeys.has(serialized)) {
        hasDuplicate = true;
      }
      seenIndexKeys.add(serialized);
    }
    return !hasDuplicate;
  };

  for (const { name, model } of models) {
    const isClean = checkIndexCleanliness(model);
    recordTest('Index Cleanliness', `Model ${name} has zero duplicate index definitions`, isClean);
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(` VERIFICATION SUMMARY: ${results.passed} PASSED | ${results.failed} FAILED`);
  console.log('================================================================\n');

  return results;
};

// Execute if run directly
if (process.argv[1]?.endsWith('verifyPhase2.js')) {
  runPhase2Verification().then((res) => {
    process.exit(res.failed === 0 ? 0 : 1);
  });
}

