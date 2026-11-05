"""
CleanLoop Complete Project Explanation PDF Generator
Generates an optimized, comprehensive 18-page academic and technical guide (.pdf)
covering the full CleanLoop Smart Waste Management System from fundamentals to production.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

# -----------------------------------------------------------------------------
# Color Tokens
# -----------------------------------------------------------------------------
COLOR_DEEP_SLATE = colors.HexColor('#263C38')
COLOR_FOREST_DARK = colors.HexColor('#1C302B')
COLOR_WARM_IVORY = colors.HexColor('#F4F1EA')
COLOR_SOFT_SAGE = colors.HexColor('#A9B9AC')
COLOR_MUTED_STONE = colors.HexColor('#E2DDD4')
COLOR_RESTRAINED_LIME = colors.HexColor('#6E8A24')
COLOR_LIME_LIGHT = colors.HexColor('#EBF2D6')
COLOR_WHITE = colors.HexColor('#FFFFFF')
COLOR_TEXT_MAIN = colors.HexColor('#1A2825')
COLOR_TEXT_MUTED = colors.HexColor('#556660')
COLOR_BORDER = colors.HexColor('#D5CEC2')
COLOR_CARD_BG = colors.HexColor('#FAF8F5')
COLOR_CODE_BG = colors.HexColor('#F0EFEB')
COLOR_AMBER = colors.HexColor('#C87D20')
COLOR_BLUE = colors.HexColor('#2471A3')

# -----------------------------------------------------------------------------
# Numbered Canvas for Running Headers and Page X of Y
# -----------------------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, total_pages):
        if self._pageNumber == 1:
            return  # Suppress on cover page

        self.saveState()
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(COLOR_TEXT_MUTED)

        # Running Header
        self.drawString(54, 11 * 72 - 34, "CLEANLOOP • COMPLETE PROJECT GUIDE & VIVA SPECIFICATION")
        self.drawRightString(8.5 * 72 - 54, 11 * 72 - 34, "SMART WASTE MANAGEMENT SYSTEM")
        self.setStrokeColor(COLOR_BORDER)
        self.setLineWidth(0.5)
        self.line(54, 11 * 72 - 38, 8.5 * 72 - 54, 11 * 72 - 38)

        # Running Footer
        self.setFont("Helvetica", 7.5)
        self.drawString(54, 30, "Academic Evaluation Copy — Department of Computer Science & Engineering | 2026")
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(8.5 * 72 - 54, 30, page_str)
        self.line(54, 40, 8.5 * 72 - 54, 40)

        self.restoreState()

# -----------------------------------------------------------------------------
# Document Builder
# -----------------------------------------------------------------------------
def build_pdf():
    output_dir = os.path.join("presentation", "documentation")
    os.makedirs(output_dir, exist_ok=True)
    pdf_path = os.path.join(output_dir, "CleanLoop_Complete_Project_Guide.pdf")

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # Typography Styles
    style_cover_title = ParagraphStyle(
        'CoverTitle', fontName='Helvetica-Bold', fontSize=28, leading=34, textColor=COLOR_DEEP_SLATE, spaceAfter=4
    )
    style_cover_sub = ParagraphStyle(
        'CoverSub', fontName='Helvetica-Bold', fontSize=14, leading=18, textColor=COLOR_RESTRAINED_LIME, spaceAfter=10
    )
    style_cover_tagline = ParagraphStyle(
        'CoverTagline', fontName='Helvetica-Oblique', fontSize=10.5, leading=14, textColor=COLOR_TEXT_MUTED, spaceAfter=16
    )
    style_h1 = ParagraphStyle(
        'ChapterH1', fontName='Helvetica-Bold', fontSize=15, leading=19, textColor=COLOR_DEEP_SLATE, spaceBefore=10, spaceAfter=5, keepWithNext=True
    )
    style_h2 = ParagraphStyle(
        'SectionH2', fontName='Helvetica-Bold', fontSize=11, leading=14.5, textColor=COLOR_FOREST_DARK, spaceBefore=7, spaceAfter=3, keepWithNext=True
    )
    style_body = ParagraphStyle(
        'Body', fontName='Helvetica', fontSize=8.5, leading=11.8, textColor=COLOR_TEXT_MAIN, spaceAfter=4
    )
    style_bullet = ParagraphStyle(
        'Bullet', fontName='Helvetica', fontSize=8.2, leading=11.4, textColor=COLOR_TEXT_MAIN, leftIndent=12, firstLineIndent=-8, spaceAfter=2
    )
    style_callout = ParagraphStyle(
        'Callout', fontName='Helvetica-Oblique', fontSize=8.2, leading=11.4, textColor=COLOR_DEEP_SLATE
    )
    style_code = ParagraphStyle(
        'Code', fontName='Courier', fontSize=7, leading=8.8, textColor=COLOR_FOREST_DARK
    )
    style_table_header = ParagraphStyle(
        'TableHeader', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=COLOR_WHITE
    )
    style_table_cell = ParagraphStyle(
        'TableCell', fontName='Helvetica', fontSize=7.6, leading=9.8, textColor=COLOR_TEXT_MAIN
    )
    style_table_cell_code = ParagraphStyle(
        'TableCellCode', fontName='Courier', fontSize=7.2, leading=9.2, textColor=COLOR_FOREST_DARK
    )
    style_q = ParagraphStyle(
        'VivaQ', fontName='Helvetica-Bold', fontSize=8.5, leading=11.5, textColor=COLOR_DEEP_SLATE, spaceBefore=4, spaceAfter=1, keepWithNext=True
    )
    style_a = ParagraphStyle(
        'VivaA', fontName='Helvetica', fontSize=8, leading=10.8, textColor=COLOR_TEXT_MAIN, spaceAfter=4
    )

    story = []

    def make_callout(text, bg=COLOR_CARD_BG, border=COLOR_RESTRAINED_LIME):
        p = Paragraph(text, style_callout)
        t = Table([[p]], colWidths=[504])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg),
            ('BOX', (0,0), (-1,-1), 0.8, border),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        return t

    def make_code_box(code_text):
        p = Paragraph(code_text.replace('\n', '<br/>').replace(' ', '&nbsp;'), style_code)
        t = Table([[p]], colWidths=[504])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), COLOR_CODE_BG),
            ('BOX', (0,0), (-1,-1), 0.6, COLOR_BORDER),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        return t

    # =========================================================================
    # PAGE 1: COVER
    # =========================================================================
    story.append(Spacer(1, 10))
    pill_text = "<b>● CIVIC SANITATION  ● SMART STEWARDSHIP  ● CLOSED-LOOP ACCOUNTABILITY</b>"
    story.append(Paragraph(pill_text, ParagraphStyle('Pill', parent=style_body, fontSize=8, textColor=COLOR_RESTRAINED_LIME)))
    story.append(Spacer(1, 6))
    story.append(Paragraph("CleanLoop", style_cover_title))
    story.append(Paragraph("Smart Waste Management & Civic Remediation System", style_cover_sub))
    story.append(Paragraph('"Small Actions. Cleaner Streets. Better Tomorrow."', style_cover_tagline))
    story.append(HRFlowable(width="100%", thickness=1.2, color=COLOR_DEEP_SLATE, spaceBefore=0, spaceAfter=14))

    meta_data = [
        [
            Paragraph("<b>PROJECT EVALUATION METADATA</b>", ParagraphStyle('M1', fontName='Helvetica-Bold', fontSize=9, textColor=COLOR_DEEP_SLATE)),
            Paragraph("<b>INSTITUTIONAL GUIDANCE</b>", ParagraphStyle('M2', fontName='Helvetica-Bold', fontSize=9, textColor=COLOR_DEEP_SLATE))
        ],
        [
            Paragraph(
                "<b>Project Title:</b> CleanLoop Smart Waste Management System<br/>"
                "<b>Document Scope:</b> Comprehensive System Architecture & Viva Guide<br/>"
                "<b>Architecture:</b> Full-Stack MERN (MongoDB, Express, React, Node)<br/>"
                "<b>Cloud Deployment:</b> Vercel (SPA) + Render (API) + Atlas (Cloud DB)<br/>"
                "<b>Quality Assurance:</b> 383 Automated Assertions (100% PASS)<br/>"
                "<b>Academic Year:</b> 2026",
                style_body
            ),
            Paragraph(
                "<b>Project Guide:</b><br/>"
                "[Faculty Guide Name, Designation / Department]<br/><br/>"
                "<b>Department & Institution:</b><br/>"
                "Department of Computer Science & Engineering<br/>"
                "[University / College Name]<br/>"
                "B.Tech Final Year Academic Evaluation",
                style_body
            )
        ],
        [
            Paragraph("<b>TEAM MEMBERS & RESPONSIBILITIES</b>", ParagraphStyle('M3', fontName='Helvetica-Bold', fontSize=9, textColor=COLOR_DEEP_SLATE)),
            Paragraph("<b>SOURCE CONTROL & STATUS</b>", ParagraphStyle('M4', fontName='Helvetica-Bold', fontSize=9, textColor=COLOR_DEEP_SLATE))
        ],
        [
            Paragraph(
                "<b>1. Bhuthukuri Sunitha</b> (241FA04492) — Frontend UI/UX, Leaflet Maps, State Architecture<br/>"
                "<b>2. Babul Kumar</b> (241FA04534) — Backend REST APIs, Cloudinary, Database & Deployment<br/>"
                "<b>3. Ayush Kumar</b> (241FA04552) — Triage Lifecycle, Verification Audit & Gamification",
                style_body
            ),
            Paragraph(
                "<b>Git Repository:</b><br/>"
                "<font color='#2471A3'>https://github.com/Babul534/CleanLoop.git</font><br/><br/>"
                "<b>Branch:</b> main (Commit 18b1704)<br/>"
                "<b>Production Readiness:</b> Phase 10 Stage 2 Verified",
                style_body
            )
        ]
    ]

    t_meta = Table(meta_data, colWidths=[246, 258])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, COLOR_BORDER),
        ('LINEBELOW', (0,0), (1,0), 0.6, COLOR_BORDER),
        ('LINEBELOW', (0,2), (1,2), 0.6, COLOR_BORDER),
        ('LINEBEFORE', (1,0), (1,-1), 0.6, COLOR_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    img_admin = os.path.join("presentation", "screenshots", "admin_dashboard.jpg")
    img_home = os.path.join("presentation", "screenshots", "homepage.jpg")
    if os.path.exists(img_admin) and os.path.exists(img_home):
        t_imgs = Table([
            [Image(img_home, width=245, height=130), Image(img_admin, width=245, height=130)],
            [Paragraph("<font size=6.5 color='#556660'>Public Portal & Civic Intake UI</font>", style_body),
             Paragraph("<font size=6.5 color='#556660'>Municipal Command Center (Admin Triage & Hotspots)</font>", style_body)]
        ], colWidths=[252, 252])
        t_imgs.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(t_imgs)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: TABLE OF CONTENTS
    # =========================================================================
    story.append(Paragraph("Table of Contents", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=8))

    toc_items = [
        ("Chapter 1: Project Overview & Problem Statement", "Foundational context, urban waste bottlenecks, user roles, core objectives."),
        ("Chapter 2: Complete System Architecture", "Multi-tier infrastructure topology, network communication, Cloudinary & Atlas integration."),
        ("Chapter 3: The MERN Stack Deep-Dive", "MongoDB NoSQL schemas, Express.js middleware, React 18 hooks & routing, Node.js event loop."),
        ("Chapter 4: Auxiliary Technologies & Engineering Choices", "JWT, bcryptjs, Multer, Leaflet, Supercluster, Heatmaps, Vercel & Render justifications."),
        ("Chapter 5: Authentication, RBAC & Security Infrastructure", "Password hashing salt rounds, bearer tokens, role guards, rate limiting, and CORS guards."),
        ("Chapter 6: Complete Database Schema Design", "Mongoose models: User, Complaint, Assignment, Notification, PointsTransaction, GeoJSON 2dsphere."),
        ("Chapter 7: Complaint Management & Supervisory Lifecycle", "The 8-stage complaint lifecycle, transition validation, Before/After supervisory photo audit."),
        ("Chapter 8: Image Processing & Cloudinary Media Pipeline", "Multer memory buffers, magic-byte MIME validation, Cloudinary streaming, and CDN delivery."),
        ("Chapter 9: Spatial Intelligence & Geospatial Analytics", "GPS geolocation, OpenStreetMap tiles, Supercluster point clustering, and kernel density heatmaps."),
        ("Chapter 10: In-App Notifications & Green Points Ledger", "Asynchronous alert triggers, atomic single-credit idempotency, milestone badges & leaderboard."),
        ("Chapter 11: Comprehensive REST API Specification", "Complete route signatures, payload contracts, status codes, and internal execution logic."),
        ("Chapter 12: End-to-End Execution Trace", "Step-by-step trace of a citizen filing a report from React form to Cloudinary, MongoDB, and UI update."),
        ("Chapter 13: Production Deployment & Cloud Hosting", "Dual-cloud deployment topology: Vercel SPA rewrites, Render web service, trust proxy, zero secret leaks."),
        ("Chapter 14: Quality Assurance & Automated Test Results", "383 verified automated test assertions spanning Phase 2 through Phase 10 Stage 2."),
        ("Chapter 15: Engineering Challenges & Solved Bottlenecks", "Idempotency locks, 2dsphere coordinate ordering, Render cold starts, and token RBAC isolation."),
        ("Chapter 16: Future Project Roadmap", "AI waste classification (TensorFlow/Gemini), IoT smart bin telemetry, and collection truck route optimization."),
        ("Chapter 17: Complete Viva Voce Guide & 45 Examiner Q&As", "2-minute pitch, 5-minute deep-dive, architecture defense, and 45 comprehensive examination Q&As.")
    ]

    toc_data = []
    for title, desc in toc_items:
        toc_data.append([
            Paragraph(f"<b>{title}</b>", style_body),
            Paragraph(desc, ParagraphStyle('TOCDesc', fontName='Helvetica', fontSize=7.5, leading=9.5, textColor=COLOR_TEXT_MUTED))
        ])

    t_toc = Table(toc_data, colWidths=[190, 314])
    t_toc.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.4, COLOR_MUTED_STONE),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_toc)
    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 1 & 2: OVERVIEW & ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("Chapter 1 — Project Overview & Problem Statement", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    story.append(Paragraph("1.1 What is CleanLoop?", style_h2))
    story.append(Paragraph(
        "<b>CleanLoop</b> is a production-grade, full-stack Smart Waste Management and Civic Remediation Platform designed to close the feedback loop between municipal citizens, administrative supervisors, and on-ground sanitation workers. "
        "Unlike conventional municipal complaint portals that act as passive 'drop boxes' where grievances disappear without visibility, CleanLoop implements an <b>end-to-end closed-loop governance pipeline</b>. "
        "Every reported waste incident is geo-tagged, triaged according to severity, dispatched to field sanitation collectors, verified through mandatory photographic evidence (comparing citizen 'Before' photographs against collector 'After' photographs), and incentivized through an immutable civic Green Points reward ledger.",
        style_body
    ))

    story.append(Paragraph("1.2 The Urban Waste Crisis & Traditional Bottlenecks", style_h2))
    story.append(Paragraph(
        "Urban centers generate over 2 billion tonnes of municipal solid waste annually, with developing cities struggling to collect up to 40% of waste generated. "
        "However, the fundamental barrier to efficient municipal sanitation is rarely a total lack of sanitation trucks; rather, it is an <b>information asymmetry and accountability failure</b>:",
        style_body
    ))
    story.append(Paragraph("• <b>Vague Location Descriptions:</b> Complaints filed via hotlines or registers write ambiguous descriptions like <i>'behind the bus stop'</i>. Sanitation trucks spend hours searching blindly, wasting fuel and labor.", style_bullet))
    story.append(Paragraph("• <b>Ghost Resolutions & Administrative Fraud:</b> Without visual proof, supervisors mark complaints 'resolved' to meet SLA quotas, while garbage piles remain decomposing on the roadside.", style_bullet))
    story.append(Paragraph("• <b>Citizen Apathy & Disconnection:</b> When citizens report waste and receive zero tracking updates, they stop reporting altogether, leading to community neglect.", style_bullet))
    story.append(Paragraph("• <b>Unbalanced Crew Dispatch:</b> Control rooms lack real-time visibility into which collectors are idle, which are overloaded, and where geographic density hotspots are forming across city wards.", style_bullet))

    story.append(Spacer(1, 3))
    story.append(make_callout(
        "<b>The Core CleanLoop Innovation:</b> A closed-loop feedback mechanism where no complaint can transition to 'Resolved' status without two mandatory elements: "
        "(1) On-ground cleanup evidence photographs uploaded by the assigned collector, and "
        "(2) Independent visual verification by a municipal administrator comparing citizen 'Before' proof against collector 'After' proof."
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("1.3 The Three Core Stakeholder Roles", style_h2))
    roles_table = [
        [Paragraph("Role", style_table_header), Paragraph("Key Responsibilities & Operational Scope in CleanLoop", style_table_header)],
        [
            Paragraph("<b>Citizen</b> ('user')", style_table_cell),
            Paragraph("• Submit geo-tagged waste reports with photos, category, and severity in &lt; 60 seconds.<br/>• Pick location via device GPS or interactive OpenStreetMap pin-drop.<br/>• Track live 5-stage complaint lifecycle with municipal activity logs.<br/>• Earn Green Points upon verified resolution and unlock achievement badges.", style_table_cell)
        ],
        [
            Paragraph("<b>Municipal Admin</b> ('admin')", style_table_cell),
            Paragraph("• Monitor live operational KPIs (Total Reports, Pending Triage, Active Work, Resolved).<br/>• Review incoming reports, elevate priority (Low, Medium, High, Urgent), and verify validity.<br/>• Dispatch available sanitation collectors based on roster availability.<br/>• Conduct side-by-side Before/After photo comparison audits to authorize resolution and point payouts.", style_table_cell)
        ],
        [
            Paragraph("<b>Sanitation Collector</b> ('collector')", style_table_cell),
            Paragraph("• View mobile-optimized queue of assigned remediation tasks with direct coordinates.<br/>• Accept task and update status to 'In Progress' upon arriving on site.<br/>• Upload photographic evidence of completed remediation ('After' photos) and field notes.<br/>• Submit task for administrative supervisory audit.", style_table_cell)
        ]
    ]
    t_roles = Table(roles_table, colWidths=[100, 404])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_DEEP_SLATE),
        ('GRID', (0,0), (-1,-1), 0.4, COLOR_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_roles)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Chapter 2 — Complete System Architecture & Infrastructure", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    arch_diagram = (
        "+-----------------------------------------------------------------------------------+\n"
        "|                    PRESENTATION TIER — VERCEL GLOBAL EDGE CDN                     |\n"
        "|   React 18 Single Page Application (SPA) + Vite 6 + React Router DOM 6            |\n"
        "|   [Citizen Portal]           [Municipal Command Center]        [Collector Mobile] |\n"
        "|   • Geo-Tagged Intake        • KPI Analytics & Triage          • Task Execution   |\n"
        "|   • 5-Stage Live Timeline    • Before/After Photo Audit        • Evidence Upload  |\n"
        "+-----------------------------------------+-----------------------------------------+\n"
        "                                          | HTTPS / REST APIs (JSON + Multipart)\n"
        "                                          v\n"
        "+-----------------------------------------------------------------------------------+\n"
        "|                     APPLICATION TIER — RENDER WEB SERVICE                         |\n"
        "|   Node.js Runtime + Express.js API Gateway (Reverse Proxy 'trust proxy: 1')       |\n"
        "|   • Security: Helmet Headers, Dynamic CORS Whitelist, Express Rate Limiting       |\n"
        "|   • Middleware: JWT Bearer AuthGuard, RoleRoute Authorization, Multer Memory RAM  |\n"
        "|   • Controllers: Complaints, Admin Triage, Collector Tasks, Green Points Engine   |\n"
        "+--------------------+-------------------------------------+------------------------+\n"
        "                     | BSON / Mongoose TLS                 | Multipart Upload Stream\n"
        "                     v                                     v\n"
        "+-------------------------------------+   +-----------------------------------------+\n"
        "|    DATA TIER — MONGODB ATLAS        |   |      MEDIA TIER — CLOUDINARY CDN        |\n"
        "|  Cloud Database Cluster (M0 Tier)   |   |  Global Media Asset Management          |\n"
        "|  • User, Complaint, Assignment      |   |  • Citizen 'Before' Photographs         |\n"
        "|  • PointsTransaction (Ledger)       |   |  • Collector 'After' Evidence Photos    |\n"
        "|  • 2dsphere Geospatial Indexing     |   |  • On-the-fly Image Resizing / CDN      |\n"
        "+-------------------------------------+   +-----------------------------------------+"
    )
    story.append(make_code_box(arch_diagram))
    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 3 & 4: MERN STACK & AUXILIARY TECHNOLOGIES
    # =========================================================================
    story.append(Paragraph("Chapter 3 — The MERN Stack Deep-Dive", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    story.append(Paragraph("3.1 MongoDB (NoSQL Database Layer)", style_h2))
    story.append(Paragraph(
        "<b>What is MongoDB?</b> MongoDB is a high-performance, document-oriented NoSQL database that stores data as flexible, self-describing <b>BSON (Binary JSON) documents</b> grouped into collections. "
        "Unlike relational databases, MongoDB allows CleanLoop to embed complex sub-structures—such as an evolving status timeline (`statusHistory`) and multiple photo records (`images`)—directly inside a single document, eliminating costly relational JOINs. "
        "Furthermore, MongoDB provides native <b>2dsphere geospatial indexing</b> that performs spherical calculations on the Earth's surface directly inside the database engine. "
        "Mongoose acts as an Object Document Mapper (ODM), compiling strict schemas, enforcing field types, providing pre/post hooks, and supporting `populate()` to resolve document references.",
        style_body
    ))

    story.append(Paragraph("3.2 Express.js (Backend Framework Layer)", style_h2))
    story.append(Paragraph(
        "Express is a minimalist, flexible web framework for Node.js. In CleanLoop, Express provides the HTTP routing backbone and middleware pipeline. "
        "Incoming requests pass through a modular chain: <code>Request -> helmet() -> cors() -> rateLimiter -> express.json() -> authMiddleware -> roleRoute -> Controller -> Response</code>. "
        "Business logic is partitioned into controllers (`complaintController.js`, `adminController.js`, `collectorController.js`), and all asynchronous errors are forwarded to `errorHandler.js` to return uniform JSON error envelopes.",
        style_body
    ))

    story.append(Paragraph("3.3 React.js (Frontend Client Layer)", style_h2))
    story.append(Paragraph(
        "React 18 powers CleanLoop’s declarative, component-driven Single Page Application (SPA). React maintains an in-memory Virtual DOM to compute optimal reconciliation diffs. "
        "CleanLoop extensively leverages modern React hooks: <code>useState</code> for component-level UI state (modals, filters, form inputs), <code>useEffect</code> for API fetching on mount and Leaflet map synchronization, <code>useContext</code> (`AuthContext.jsx`) for global authentication state, <code>useNavigate</code> for programmatic routing, and <code>useRef</code> for Leaflet map instance caching.",
        style_body
    ))

    story.append(Paragraph("3.4 Node.js (Runtime Environment)", style_h2))
    story.append(Paragraph(
        "Node.js executes JavaScript on the server using Chrome's V8 engine. Built on a <b>single-threaded, non-blocking, event-driven I/O model</b>, Node offloads database queries and network streaming to libuv worker threads. "
        "When I/O finishes, an event callback is pushed to the event loop. This enables CleanLoop to service hundreds of concurrent municipal requests with minimal memory footprint on free-tier containers.",
        style_body
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Chapter 4 — Auxiliary Technologies & Technical Justification", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    aux_tech = [
        [Paragraph("Technology", style_table_header), Paragraph("Where Used & How It Works", style_table_header), Paragraph("Why Selected Over Alternatives", style_table_header)],
        [
            Paragraph("<b>JWT</b>", style_table_cell),
            Paragraph("Generates stateless bearer tokens upon login containing user ID and role, signed with HMAC-SHA256 (`JWT_SECRET`). Attached to client request headers.", style_table_cell),
            Paragraph("Enables stateless horizontal scaling. Eliminates server-side session stores (like Redis) required by traditional cookie sessions.", style_table_cell)
        ],
        [
            Paragraph("<b>bcryptjs</b>", style_table_cell),
            Paragraph("Hashes user passwords with 10 random cryptographic salt rounds before persisting to MongoDB. Compares hashes during login.", style_table_cell),
            Paragraph("One-way cryptographic hash with built-in salt generation defeats rainbow table attacks and brute-force GPU cracking.", style_table_cell)
        ],
        [
            Paragraph("<b>Multer (Memory)</b>", style_table_cell),
            Paragraph("Intercepts `multipart/form-data` uploads in `uploadMiddleware.js`, buffering file buffers in RAM (`memoryStorage()`) rather than disk.", style_table_cell),
            Paragraph("Cloud container platforms (Render, Heroku) run ephemeral filesystems. In-memory buffering avoids orphaned temporary files.", style_table_cell)
        ],
        [
            Paragraph("<b>Cloudinary CDN</b>", style_table_cell),
            Paragraph("Stores citizen complaint images and collector cleanup proof. Generates secure CDN URLs with automated image compression.", style_table_cell),
            Paragraph("Direct image storage inside MongoDB (Base64/GridFS) bloats database size and destroys query performance. Cloudinary offloads media bandwidth.", style_table_cell)
        ],
        [
            Paragraph("<b>Leaflet & OSM</b>", style_table_cell),
            Paragraph("Renders interactive city maps for location picking and administrative incident distribution using public OSM tile servers.", style_table_cell),
            Paragraph("Free and open-source. Eliminates expensive Google Maps JavaScript API credit card gates and billing limits for academic projects.", style_table_cell)
        ],
        [
            Paragraph("<b>Supercluster</b>", style_table_cell),
            Paragraph("Hierarchical geospatial point clustering engine running client-side inside `AdminCityMap.jsx`.", style_table_cell),
            Paragraph("Rendering 500 individual DOM marker pins lags the browser. Supercluster groups nearby pins into interactive cluster circles dynamically.", style_table_cell)
        ],
        [
            Paragraph("<b>Leaflet.heat</b>", style_table_cell),
            Paragraph("Calculates Gaussian kernel density gradients over complaint coordinates to visualize waste intensity hotspots.", style_table_cell),
            Paragraph("Allows municipal planners to identify chronic dumping zones and repeat offending neighborhoods at a glance.", style_table_cell)
        ],
        [
            Paragraph("<b>Vercel & Render</b>", style_table_cell),
            Paragraph("Vercel hosts the React SPA on global edge CDN with SPA rewrites. Render hosts the Node.js API with automated git deployment.", style_table_cell),
            Paragraph("Industry standard free-tier production pair. Vercel delivers instant static asset delivery; Render manages Node reverse proxies.", style_table_cell)
        ]
    ]

    t_aux = Table(aux_tech, colWidths=[80, 220, 204])
    t_aux.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_DEEP_SLATE),
        ('GRID', (0,0), (-1,-1), 0.4, COLOR_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_aux)
    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 5 & 6: AUTHENTICATION & DATABASE SCHEMAS
    # =========================================================================
    story.append(Paragraph("Chapter 5 — Authentication, RBAC & Security Infrastructure", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    story.append(Paragraph("5.1 Authentication Flow & Token Lifecycle", style_h2))
    story.append(Paragraph(
        "CleanLoop implements stateless JWT Bearer token authentication. "
        "Upon registration (`POST /api/auth/register`), the user's password is encrypted using `bcrypt.hash()` with 10 salt rounds. "
        "Upon login (`POST /api/auth/login`), the entered password is compared against the stored hash via `bcrypt.compare()`. "
        "If valid, the server signs a 24-hour token containing `{ id: user._id, role: user.role }` using `JWT_SECRET`. "
        "The React client stores the token in `localStorage` and injects it via an Axios request interceptor (`Authorization: Bearer <token>`).",
        style_body
    ))

    auth_box = (
        "Client (React)              Express API Gateway                MongoDB Atlas\n"
        "  |--- 1. POST /login ---------->|                                  |\n"
        "  |    { email, password }       |--- 2. Find user by email ------->|\n"
        "  |                              |<-- 3. Return user doc -----------|\n"
        "  |                              |--- 4. bcrypt.compare(pass, hash) |\n"
        "  |                              |--- 5. jwt.sign({ id, role })     |\n"
        "  |<-- 6. 200 { token, user } ---|                                  |\n"
        "  |                              |                                  |\n"
        "  |--- 7. Protected Request ---->|--- 8. authMiddleware verifies JWT|\n"
        "  |    Bearer <token>            |--- 9. RoleRoute checks role ---->|\n"
        "  |<-- 10. Authorized Data ------|                                  |"
    )
    story.append(make_code_box(auth_box))
    story.append(Spacer(1, 4))

    story.append(Paragraph("5.2 Role-Based Access Control (RBAC) & Security Hardening", style_h2))
    story.append(Paragraph("• <b>Backend Role Guards:</b> `authorize(...allowedRoles)` intercepts requests after `authMiddleware`, verifying that `req.user.role` matches allowed roles (e.g. only `'admin'` can dispatch collectors; only `'collector'` can submit evidence).", style_bullet))
    story.append(Paragraph("• <b>Frontend Role Routing:</b> `<ProtectedRoute>` and `<RoleRoute allowedRoles={['user']}>` guard views on the client, redirecting unauthorized users to login or their home portal.", style_bullet))
    story.append(Paragraph("• <b>Rate Limiting & Helmet:</b> `express-rate-limit` throttles login attempts (10/15min) and general requests (100/15min). Helmet sets secure HTTP response headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).", style_bullet))
    story.append(Paragraph("• <b>Dynamic CORS Whitelist:</b> `server/src/app.js` normalizes `CLIENT_URL` and `ALLOWED_ORIGINS`, stripping trailing slashes and dynamically allowing authorized origins while blocking cross-origin attacks.", style_bullet))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Chapter 6 — Complete Database Schema Design & Models", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    models_spec = [
        [Paragraph("Model", style_table_header), Paragraph("Key Fields & Schema Definitions", style_table_header), Paragraph("Indexes & Integrity Constraints", style_table_header)],
        [
            Paragraph("<b>User</b>", style_table_cell),
            Paragraph("`name`, `email` (lowercase, trim), `passwordHash`, `role` (enum: 'user','admin','collector'), `pointsBalance` (default: 0), `phone`, `address`.", style_table_cell),
            Paragraph("Unique index on `email`. Role-restricted enum validation. Schema method `comparePassword()` using bcrypt.", style_table_cell)
        ],
        [
            Paragraph("<b>Complaint</b>", style_table_cell),
            Paragraph("`title`, `description`, `category` (plastic, organic, hazardous, mixed, other), `priority` (low, medium, high, urgent), `status` (pending, under_review, assigned, in_progress, awaiting_verification, resolved, rejected), `location` (GeoJSON Point), `images` array, `citizenId`, `resolvedAt`, `statusHistory` array.", style_table_cell),
            Paragraph("<b>2dsphere index</b> on `location`. Compound index on `{ status: 1, priority: 1, createdAt: -1 }`. Sub-document audit array.", style_table_cell)
        ],
        [
            Paragraph("<b>Assignment</b>", style_table_cell),
            Paragraph("`complaintId` (ref Complaint), `collectorId` (ref User), `status` (assigned, accepted, in_progress, submitted_for_verification, verified), `evidencePhotos` array, `completionNotes`, `assignedAt`, `verifiedAt`.", style_table_cell),
            Paragraph("Compound index on `{ collectorId: 1, status: 1 }`. Prevents multiple active assignments for the same complaint.", style_table_cell)
        ],
        [
            Paragraph("<b>PointsTransaction</b>", style_table_cell),
            Paragraph("`citizenId` (ref User), `complaintId` (ref Complaint), `points` (Number), `type` (credit/debit), `reason` (String), `balanceAfter` (Number), `createdAt`.", style_table_cell),
            Paragraph("Immutable financial ledger. Unique compound index on `{ complaintId: 1, type: 1 }` prevents double-awarding green points.", style_table_cell)
        ],
        [
            Paragraph("<b>Notification</b>", style_table_cell),
            Paragraph("`recipient` (ref User), `title`, `message`, `type` (status_update, assignment, points_awarded, system), `isRead` (boolean), `link`, `createdAt`.", style_table_cell),
            Paragraph("Index on `{ recipient: 1, isRead: 1, createdAt: -1 }` for sub-millisecond unread counter badges.", style_table_cell)
        ],
        [
            Paragraph("<b>RewardRule &<br/>UserBadge</b>", style_table_cell),
            Paragraph("`RewardRule`: criteria, points awarded, active status. `UserBadge`: `userId` (ref User), `badgeId` ('first_cleanup', 'green_starter'), `unlockedAt`.", style_table_cell),
            Paragraph("Unique compound index `{ userId: 1, badgeId: 1 }` ensures each milestone badge is unlocked strictly once.", style_table_cell)
        ]
    ]

    t_mod = Table(models_spec, colWidths=[75, 235, 194])
    t_mod.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_DEEP_SLATE),
        ('GRID', (0,0), (-1,-1), 0.4, COLOR_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_mod)
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        "<b>GeoJSON Coordinate Standard:</b> MongoDB strictly requires <code>[longitude, latitude]</code> (equivalent to Cartesian `[X, Y]`), inverting traditional GPS format. Reversing coordinates causes spatial query failures.",
        ParagraphStyle('GeoWarn', parent=style_body, fontSize=8, textColor=COLOR_AMBER)
    ))
    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 7 & 8: LIFECYCLE & IMAGE UPLOADS
    # =========================================================================
    story.append(Paragraph("Chapter 7 — Complaint Lifecycle & Supervisory Audit", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    lifecycle_diagram = (
        "  [1. PENDING] -------- Citizen submits report with photo and GPS location\n"
        "        |\n"
        "        v\n"
        "  [2. UNDER REVIEW] --- Admin reviews complaint validity and sets priority (Low/Med/High/Urgent)\n"
        "        |\n"
        "        +-----------------------------------+ (If invalid/duplicate)\n"
        "        |                                   v\n"
        "        v                             [REJECTED] -> Closed with mandatory admin reason\n"
        "  [3. ASSIGNED] ------- Admin dispatches available collector; synced to complaint\n"
        "        |\n"
        "        v\n"
        "  [4. ACCEPTED] ------- Collector acknowledges task assignment on mobile\n"
        "        |\n"
        "        v\n"
        "  [5. IN PROGRESS] ---- Collector arrives on site and begins physical remediation\n"
        "        |\n"
        "        v\n"
        "  [6. AWAITING VERIF] - Collector uploads 'After' photos & notes; task locked\n"
        "        |\n"
        "        v\n"
        "  [7. RESOLVED] ------- Admin inspects Before vs After photo comparison modal; verifies cleanup\n"
        "        |\n"
        "        v\n"
        "  [8. GREEN POINTS] --- System atomically credits Green Points to citizen & unlocks badges"
    )
    story.append(make_code_box(lifecycle_diagram))
    story.append(Spacer(1, 4))

    story.append(Paragraph("7.2 Supervisory Audit & Fraud Prevention Rules", style_h2))
    story.append(Paragraph("1. <b>Collectors Cannot Resolve Directly:</b> Collectors can only transition tasks to `submitted_for_verification`. Only administrators can mark a complaint `resolved` after visual audit.", style_bullet))
    story.append(Paragraph("2. <b>Mandatory Evidence Requirement:</b> `PATCH /api/collector/assignments/:id/submit` returns HTTP 400 if `evidencePhotos` is empty. No complaint can be verified without proof.", style_bullet))
    story.append(Paragraph("3. <b>Before & After Photo Comparison:</b> The admin verification interface (`BeforeAfterComparison.jsx`) displays citizen 'Before' photographs side-by-side with collector 'After' photographs with lightbox zoom.", style_bullet))
    story.append(Paragraph("4. <b>Immutable Audit Trail:</b> Every status update pushes `{ status, changedAt, changedBy, note }` to `statusHistory`, ensuring complete civic accountability.", style_bullet))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Chapter 8 — Image Processing & Cloudinary Media Pipeline", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    story.append(Paragraph("8.1 In-Memory Buffer Streaming Architecture", style_h2))
    story.append(Paragraph(
        "Storing raw binary images in MongoDB (Base64) increases document size by 33% and breaches MongoDB's 16MB document limit. "
        "Saving images to local disk fails on Render's ephemeral containers. CleanLoop resolves this through an in-memory streaming pipeline: "
        "Multer buffers chunks in RAM (`memoryStorage()`), validates MIME types (`image/jpeg`, `image/png`, `image/webp`) and enforces a 5MB limit. "
        "The buffer is streamed directly to Cloudinary over HTTPS via `cloudinary.uploader.upload_stream`. "
        "Cloudinary compresses the image, generates CDN thumbnails, and returns `{ url, publicId }`, which is persisted in MongoDB.",
        style_body
    ))
    story.append(Paragraph("• <b>Evidence Isolation:</b> Citizen photos are stored in `Complaint.images`; collector proof is stored in `Assignment.evidencePhotos`, guaranteeing original report evidence is never overwritten.", style_bullet))
    story.append(Paragraph("• <b>Public ID Tracking:</b> Storing `publicId` allows CleanLoop to programmatically delete orphaned images from Cloudinary if a report is purged.", style_bullet))
    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 9 & 10: MAPS & NOTIFICATIONS/REWARDS
    # =========================================================================
    story.append(Paragraph("Chapter 9 — Spatial Intelligence & Geospatial Analytics", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    story.append(Paragraph("9.1 Dual-Mode Geolocation Intake & OpenStreetMap", style_h2))
    story.append(Paragraph(
        "CleanLoop provides citizens with dual-mode location selection (`LocationPickerMap.jsx`): browser GPS auto-detection via `navigator.geolocation.getCurrentPosition` for instant acquisition, "
        "and interactive OpenStreetMap pin-drop selection allowing users to drag or click the pin precisely on the waste pile. "
        "Using OpenStreetMap standard tiles eliminates vendor lock-in and billing gates associated with Google Maps API.",
        style_body
    ))

    story.append(Paragraph("9.2 Marker Clustering vs. Kernel Density Heatmaps", style_h2))
    map_modes = [
        [Paragraph("Feature", style_table_header), Paragraph("Marker Clustering Mode (Supercluster)", style_table_header), Paragraph("Kernel Density Heatmap Mode (Leaflet.heat)", style_table_header)],
        [
            Paragraph("<b>Underlying Engine</b>", style_table_cell),
            Paragraph("`supercluster` hierarchical k-d tree spatial clustering running on geojson point arrays.", style_table_cell),
            Paragraph("`leaflet.heat` 2D Gaussian density gradient convolution algorithm.", style_table_cell)
        ],
        [
            Paragraph("<b>Primary Purpose</b>", style_table_cell),
            Paragraph("Operational dispatch: Groups individual complaints into numeric bubble clusters, expanding into clickable pins on zoom.", style_table_cell),
            Paragraph("Strategic planning: Visualizes continuous color gradients (Green -> Yellow -> Red) showing chronic dumping density.", style_table_cell)
        ],
        [
            Paragraph("<b>Interaction</b>", style_table_cell),
            Paragraph("Clicking a cluster zooms the map to spiderfy pins; clicking an individual pin opens a triage action popup.", style_table_cell),
            Paragraph("Passive visual overlay; illustrates high-density waste generation hotspots across municipal wards.", style_table_cell)
        ]
    ]
    t_map = Table(map_modes, colWidths=[90, 207, 207])
    t_map.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_DEEP_SLATE),
        ('GRID', (0,0), (-1,-1), 0.4, COLOR_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_map)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Chapter 10 — In-App Notifications & Green Points Ledger", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    story.append(Paragraph("10.1 In-App Notifications & Non-Blocking Architecture", style_h2))
    story.append(Paragraph(
        "CleanLoop’s notification engine (`notificationService.js`) alerts stakeholders across key milestones: report receipt confirmation, crew dispatch, remediation commencement, and verified resolution. "
        "Notifications execute in non-blocking background handlers; any alert delivery error is caught and logged without aborting core database transactions.",
        style_body
    ))

    story.append(Paragraph("10.2 Green Points Ledger & Idempotency Guarantee", style_h2))
    story.append(Paragraph(
        "Upon verified resolution, citizens receive +50 to +100 Green Points. Financial-grade integrity is guaranteed via three mechanisms:<br/>"
        "• <b>Status Gating:</b> Verification API requires complaint status to be `awaiting_verification`. Once verified, status is `resolved`; subsequent calls return HTTP 400 Bad Request.<br/>"
        "• <b>Ledger Uniqueness:</b> Every credit creates an immutable `PointsTransaction` record with a compound unique index `{ complaintId: 1, type: 1 }`, ensuring repeated API requests cannot create duplicate rewards.<br/>"
        "• <b>Civic Privacy Leaderboard:</b> Top citizens are displayed on the public leaderboard with masked identities (e.g. `Ayush K***`), strictly omitting passwords, emails, or phone numbers.",
        style_body
    ))
    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 11 & 12: APIS & EXECUTION TRACE
    # =========================================================================
    story.append(Paragraph("Chapter 11 — Comprehensive REST API Specification", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    api_table = [
        [Paragraph("Method & Endpoint", style_table_header), Paragraph("Role Required", style_table_header), Paragraph("Description & Internal Mechanics", style_table_header)],
        [
            Paragraph("<b>POST /api/auth/register</b>", style_table_cell_code),
            Paragraph("Public", style_table_cell),
            Paragraph("Registers citizen account. Hashes password via bcrypt (10 salt rounds).", style_table_cell)
        ],
        [
            Paragraph("<b>POST /api/auth/login</b>", style_table_cell_code),
            Paragraph("Public", style_table_cell),
            Paragraph("Validates credentials, checks bcrypt hash, returns 24h signed JWT bearer token.", style_table_cell)
        ],
        [
            Paragraph("<b>POST /api/complaints</b>", style_table_cell_code),
            Paragraph("Citizen (user)", style_table_cell),
            Paragraph("Multipart form upload. Buffers images to Cloudinary, creates GeoJSON Point complaint.", style_table_cell)
        ],
        [
            Paragraph("<b>GET /api/complaints/my</b>", style_table_cell_code),
            Paragraph("Citizen (user)", style_table_cell),
            Paragraph("Retrieves paginated personal complaint history with category and status filters.", style_table_cell)
        ],
        [
            Paragraph("<b>GET /api/admin/complaints</b>", style_table_cell_code),
            Paragraph("Admin", style_table_cell),
            Paragraph("Triage queue returning all municipal complaints with sorting and priority filtering.", style_table_cell)
        ],
        [
            Paragraph("<b>POST /api/admin/assignments</b>", style_table_cell_code),
            Paragraph("Admin", style_table_cell),
            Paragraph("Assigns available collector to complaint, transitions complaint status to 'assigned'.", style_table_cell)
        ],
        [
            Paragraph("<b>PATCH /api/collector/assignments/:id/start</b>", style_table_cell_code),
            Paragraph("Collector", style_table_cell),
            Paragraph("Collector marks task 'in_progress' upon arriving on site; notifies reporting citizen.", style_table_cell)
        ],
        [
            Paragraph("<b>PATCH /api/collector/assignments/:id/submit</b>", style_table_cell_code),
            Paragraph("Collector", style_table_cell),
            Paragraph("Uploads 'After' photos to Cloudinary; moves complaint to 'awaiting_verification'.", style_table_cell)
        ],
        [
            Paragraph("<b>PATCH /api/admin/complaints/:id/verify-resolution</b>", style_table_cell_code),
            Paragraph("Admin", style_table_cell),
            Paragraph("Verifies Before/After proof, marks 'resolved', awards Green Points idempotently.", style_table_cell)
        ],
        [
            Paragraph("<b>GET /api/rewards/leaderboard</b>", style_table_cell_code),
            Paragraph("Public / Auth", style_table_cell),
            Paragraph("Returns top civic rankings with masked identities and verified cleanup counts.", style_table_cell)
        ],
        [
            Paragraph("<b>GET /api/complaints/public/impact</b>", style_table_cell_code),
            Paragraph("Public", style_table_cell),
            Paragraph("Fetches real-time counts (total cleanups, active citizens) directly from MongoDB.", style_table_cell)
        ]
    ]

    t_api = Table(api_table, colWidths=[140, 68, 296])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_DEEP_SLATE),
        ('GRID', (0,0), (-1,-1), 0.4, COLOR_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 2.8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.8),
    ]))
    story.append(t_api)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Chapter 12 — End-to-End Execution Trace", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    story.append(Paragraph("12.1 Citizen Submits Waste Complaint (Step-by-Step)", style_h2))
    story.append(Paragraph("<b>1. React Form Submission:</b> Citizen fills title, category ('plastic'), severity ('high'), uploads dump photos, and pins location `[77.5946, 12.9716]` on `LocationPickerMap`. React validates required inputs.", style_bullet))
    story.append(Paragraph("<b>2. Axios HTTP Request:</b> Axios builds a `multipart/form-data` payload and injects `Authorization: Bearer <token>` from `localStorage`.", style_bullet))
    story.append(Paragraph("<b>3. Express Gateway & Middleware:</b> `server/src/app.js` runs `helmet()` headers, `cors()` whitelist verification, and `rateLimiter` IP quota check.", style_bullet))
    story.append(Paragraph("<b>4. Authentication Guard:</b> `authMiddleware` verifies the JWT signature against `JWT_SECRET` and attaches the user document to `req.user`.", style_bullet))
    story.append(Paragraph("<b>5. Multer Buffer & Validation:</b> `uploadMiddleware` parses multipart chunks in memory, validating MIME types and the 5MB size limit.", style_bullet))
    story.append(Paragraph("<b>6. Cloudinary Streaming:</b> `complaintController` streams image buffers to Cloudinary, receiving secure HTTPS URLs and public IDs.", style_bullet))
    story.append(Paragraph("<b>7. MongoDB Atlas Persistence:</b> Controller constructs a GeoJSON `Point [lng, lat]`, embeds Cloudinary URLs, initializes `status: 'pending'`, and saves the `Complaint` document.", style_bullet))
    story.append(Paragraph("<b>8. In-App Notification:</b> `notificationService` registers an asynchronous confirmation alert for the reporting citizen.", style_bullet))
    story.append(Paragraph("<b>9. Response & UI Update:</b> Express returns HTTP 201 Created with `{ success: true, complaint: { incidentCode: 'CLN-...', ... } }`. React redirects the user to `/my-reports`.", style_bullet))
    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 13 & 14: DEPLOYMENT & TESTING
    # =========================================================================
    story.append(Paragraph("Chapter 13 — Production Deployment & Cloud Hosting", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    dep_topology = [
        [Paragraph("Tier / Service", style_table_header), Paragraph("Cloud Platform", style_table_header), Paragraph("Configuration Details & Artifacts", style_table_header)],
        [
            Paragraph("<b>Frontend Client</b>", style_table_cell),
            Paragraph("Vercel Edge Network", style_table_cell),
            Paragraph("• Build Command: `npm --prefix client run build`<br/>• Output Directory: `client/dist`<br/>• SPA Rewrites: `client/vercel.json` maps `/(.*) -> /index.html` to prevent 404s on deep links (`/dashboard`, `/complaint/:id`).", style_table_cell)
        ],
        [
            Paragraph("<b>Backend API</b>", style_table_cell),
            Paragraph("Render Web Service", style_table_cell),
            Paragraph("• Runtime: Node.js (Linux container)<br/>• Blueprint: `render.yaml` (Infrastructure-as-Code)<br/>• Start Command: `node src/server.js`<br/>• Reverse Proxy: `app.set('trust proxy', 1)` enables real client IP extraction behind Render.", style_table_cell)
        ],
        [
            Paragraph("<b>Database</b>", style_table_cell),
            Paragraph("MongoDB Atlas", style_table_cell),
            Paragraph("• Managed M0 Cloud Cluster (AWS Oregon)<br/>• TLS encrypted in transit; automated shard replication<br/>• Network access whitelisted for dynamic cloud container IPs.", style_table_cell)
        ],
        [
            Paragraph("<b>Media CDN</b>", style_table_cell),
            Paragraph("Cloudinary", style_table_cell),
            Paragraph("• Multipart storage bucket with automatic WebP conversion and responsive thumbnail delivery.", style_table_cell)
        ]
    ]

    t_dep = Table(dep_topology, colWidths=[90, 110, 304])
    t_dep.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_DEEP_SLATE),
        ('GRID', (0,0), (-1,-1), 0.4, COLOR_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_dep)
    story.append(Spacer(1, 3))
    story.append(Paragraph("• <b>Cold-Start Mitigation:</b> `client/src/services/api.js` sets `timeout: 30000` (30s) to tolerate Render free-tier container spin-up latencies, while root health check aliases (`GET /`, `GET /health`) support uptime pings.", style_bullet))
    story.append(Paragraph("• <b>Zero Secrets Leaked:</b> Git strictly ignores `server/.env` and `client/.env`. Only sanitized `.env.example` templates are tracked.", style_bullet))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Chapter 14 — Quality Assurance & Automated Test Results", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    test_table = [
        [Paragraph("Phase / Audit Scope", style_table_header), Paragraph("Target Script Executed", style_table_header), Paragraph("Verified Assertions", style_table_header), Paragraph("Status", style_table_header)],
        [Paragraph("Phase 2: Database Models & Schemas", style_table_cell), Paragraph("`verifyPhase2.js`", style_table_cell_code), Paragraph("71 Passed / 0 Failed", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)],
        [Paragraph("Phase 3: Auth, JWT & Role-Based RBAC", style_table_cell), Paragraph("`testPhase3Auth.js`", style_table_cell_code), Paragraph("48 Passed / 0 Failed", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)],
        [Paragraph("Phase 4: Citizen Complaints & Uploads", style_table_cell), Paragraph("`testPhase4Complaints.js`", style_table_cell_code), Paragraph("45 Passed / 0 Failed", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)],
        [Paragraph("Phase 5: Tracking & Notifications", style_table_cell), Paragraph("`testPhase5Tracking.js`", style_table_cell_code), Paragraph("32 Passed / 0 Failed", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)],
        [Paragraph("Phase 6: Admin Management & Triage", style_table_cell), Paragraph("`testPhase6Admin.js`", style_table_cell_code), Paragraph("33 Passed / 0 Failed", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)],
        [Paragraph("Phase 7: Collector Workflow & Evidence", style_table_cell), Paragraph("`testPhase7Collector.js`", style_table_cell_code), Paragraph("35 Passed / 0 Failed", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)],
        [Paragraph("Phase 8: Map Analytics & Clustering", style_table_cell), Paragraph("`testPhase8MapAnalytics.js`", style_table_cell_code), Paragraph("27 Passed / 0 Failed", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)],
        [Paragraph("Phase 9: Green Points & Leaderboard", style_table_cell), Paragraph("`testPhase9Rewards.js`", style_table_cell_code), Paragraph("34 Passed / 0 Failed", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)],
        [Paragraph("End-to-End Complete User Workflow", style_table_cell), Paragraph("`testEndToEndWorkflow.js`", style_table_cell_code), Paragraph("27 Passed / 0 Failed", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)],
        [Paragraph("Lifecycle & Timeline Audit", style_table_cell), Paragraph("`testVerificationAudit.js`", style_table_cell_code), Paragraph("16 Passed / 0 Failed", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)],
        [Paragraph("Before/After Photo Comparison Audit", style_table_cell), Paragraph("`testBeforeAfterComparison.js`", style_table_cell_code), Paragraph("17 Passed / 0 Failed", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)],
        [Paragraph("Splash Screen & Homepage Audit", style_table_cell), Paragraph("`testCinematicSplashAndHomepage.js`", style_table_cell_code), Paragraph("17 Passed / 0 Failed", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)],
        [Paragraph("Phase 10 Stage 2 Deployment Config", style_table_cell), Paragraph("`testDeploymentConfig.js`", style_table_cell_code), Paragraph("18 Passed / 0 Failed", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)],
        [Paragraph("<b>TOTAL AUTOMATED TEST ASSERTIONS</b>", style_table_cell), Paragraph("<b>13 Integrated Suites</b>", style_table_cell), Paragraph("<b>383 / 383 PASSED</b>", style_table_cell), Paragraph("<b>100% PASS</b>", style_table_cell)]
    ]

    t_tests = Table(test_table, colWidths=[150, 150, 110, 94])
    t_tests.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_DEEP_SLATE),
        ('GRID', (0,0), (-1,-1), 0.4, COLOR_BORDER),
        ('BACKGROUND', (0,-1), (-1,-1), COLOR_LIME_LIGHT),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_tests)
    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 15 & 16: CHALLENGES & ROADMAP
    # =========================================================================
    story.append(Paragraph("Chapter 15 — Engineering Challenges & Technical Solutions", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    challenges = [
        ("1. Atomic Reward Idempotency (Double Payouts)",
         "<b>Challenge:</b> Rapid repeated clicks on the admin 'Verify' button sent multiple concurrent PATCH requests, crediting citizens multiple times for a single cleanup.<br/>"
         "<b>Solution:</b> Implemented a three-layer guard: (1) Status gate requiring `awaiting_verification`, (2) Compound unique index `{ complaintId: 1, type: 1 }` on `PointsTransaction`, and (3) Atomic database transaction writes."),

        ("2. GeoJSON Longitude/Latitude Inversion",
         "<b>Challenge:</b> Browser GPS returns `(latitude, longitude)`, while MongoDB GeoJSON strictly requires `[longitude, latitude]`. Early spatial queries failed or mapped coordinates to Antarctica.<br/>"
         "<b>Solution:</b> Created centralized spatial adapter functions in React and backend controllers that explicitly map `[coords.longitude, coords.latitude]` into the `{ type: 'Point', coordinates: [...] }` schema."),

        ("3. Leaflet Marker DOM Lag with High Point Densities",
         "<b>Challenge:</b> Rendering 300+ individual SVG marker pins on the city map caused frame drops and sluggish interactions on mobile browsers.<br/>"
         "<b>Solution:</b> Integrated `supercluster` client-side clustering on top of React Leaflet, grouping nearby pins into dynamic cluster bubbles at lower zoom levels."),

        ("4. Render Container Cold Starts & Client Timeouts",
         "<b>Challenge:</b> Render spins down free containers after 15 minutes of inactivity, causing 30-second initial boot delays that triggered default Axios timeouts.<br/>"
         "<b>Solution:</b> Configured `timeout: 30000` (30s) in Axios, added root health check aliases (`GET /` and `GET /health`) for automated uptime monitors, and added a warm-up banner.")
    ]

    for title, text in challenges:
        story.append(Paragraph(title, style_h2))
        story.append(Paragraph(text, style_body))

    story.append(Spacer(1, 6))
    story.append(Paragraph("Chapter 16 — Future Project Roadmap & Enhancements", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    roadmap = [
        ("1. AI Waste Image Classification", "Integrate a lightweight TensorFlow.js model or Gemini Vision API to automatically classify garbage categories (plastic, electronic, organic) from photos and recommend priority automatically."),
        ("2. IoT Smart Bin Telemetry", "Deploy ultrasonic IoT distance sensors inside public municipal bins. When a bin's fill level reaches 80%, an automated webhook creates an assignment in CleanLoop without requiring manual reporting."),
        ("3. Collection Truck Route Optimization", "Apply Dijkstra's algorithm and the Traveling Salesperson Problem (TSP) to calculate the most fuel-efficient route for municipal trucks collecting verified hotspots across city wards."),
        ("4. Civic SMS & IVR Telephony Gateway", "Integrate Twilio or an open-source IVR gateway to allow non-smartphone citizens to file reports via automated phone calls or SMS, ensuring inclusive civic coverage.")
    ]

    for title, text in roadmap:
        story.append(Paragraph(f"★ {title}", style_h2))
        story.append(Paragraph(text, style_body))

    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 17: VIVA VOCE & 45 Q&AS
    # =========================================================================
    story.append(Paragraph("Chapter 17 — Viva Voce Preparation & 45 Examiner Q&As", style_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_RESTRAINED_LIME, spaceBefore=2, spaceAfter=6))

    story.append(Paragraph("17.1 The 2-Minute Elevator Pitch", style_h2))
    story.append(make_callout(
        "<i>\"Good morning, respected examiners. Our project is <b>CleanLoop</b>, a full-stack Smart Waste Management and Civic Remediation Platform built on the MERN stack. "
        "Traditional municipal complaint systems fail because of vague descriptions, zero tracking, and ghost resolutions where workers close complaints without proof. "
        "CleanLoop solves this through an end-to-end closed-loop governance system: citizens report waste with device GPS and photos in under 60 seconds; municipal admins triage reports and dispatch collectors; collectors submit 'After' cleanup photographs; and admins conduct side-by-side Before/After verification before complaints can be resolved. "
        "Upon verified resolution, citizens earn Green Points recorded in an immutable ledger. The project is fully implemented, verified with 383 automated test assertions, and configured for production deployment across Vercel, Render, and MongoDB Atlas.\"</i>"
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("17.2 The 5-Minute Technical Deep-Dive", style_h2))
    story.append(Paragraph(
        "When explaining the technical architecture, cover these four core pillars:<br/>"
        "• <b>Decoupled Architecture:</b> React 18 SPA on Vercel communicating with an Express.js REST API on Render. Cloudinary manages multipart evidence media, while MongoDB Atlas handles BSON documents and 2dsphere GeoJSON spatial queries.<br/>"
        "• <b>Security & RBAC:</b> Stateless HMAC-SHA256 JWT tokens and 10-round salted bcrypt password hashes. Backend middleware (`authMiddleware`) and React route wrappers (`RoleRoute`) strictly isolate Citizen, Admin, and Collector capabilities.<br/>"
        "• <b>Closed-Loop Lifecycle & Idempotency:</b> An 8-stage state machine (`pending` -> `under_review` -> `assigned` -> `in_progress` -> `awaiting_verification` -> `resolved`). Collectors cannot resolve complaints directly; admin Before/After verification is mandatory. Double payouts are prevented by compound unique ledger indexes.<br/>"
        "• <b>Spatial Analytics:</b> OpenStreetMap tiles integrated with React Leaflet. Client-side point clustering via Supercluster prevents DOM lag, while Leaflet.heat computes density gradients to identify chronic dumping hotspots.",
        style_body
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("17.3 45 Comprehensive Viva Questions & Model Answers", style_h2))

    viva_qa = [
        ("Q1: What does MERN stand for, and why did you choose it?",
         "MERN stands for MongoDB, Express.js, React.js, and Node.js. We chose MERN because it unifies the entire stack under a single language (JavaScript), enables fast JSON serialization between database and client, and supports high-concurrency non-blocking I/O ideal for real-time civic dispatch."),

        ("Q2: Why use MongoDB instead of MySQL or PostgreSQL?",
         "CleanLoop requires flexible schemas for evolving complaints (embedded status audit arrays and variable photo lists) and native GeoJSON 2dsphere indexing for spherical map distance queries. Relational databases would require expensive multi-table JOINs for every status timeline lookup."),

        ("Q3: What is the difference between a SQL table and a MongoDB collection?",
         "A SQL table has a rigid, pre-defined column schema where every row must conform to the structure. A MongoDB collection contains flexible BSON documents where fields can vary, support nested sub-documents (like `statusHistory`), and evolve without schema migrations."),

        ("Q4: What is Mongoose and why is it necessary if MongoDB is schema-less?",
         "MongoDB is schema-less at the database level, but application logic requires data integrity. Mongoose is an ODM (Object Document Mapper) that enforces schemas, validates field types and required rules, compiles models, and provides lifecycle middleware hooks."),

        ("Q5: What is the Node.js Event Loop?",
         "The event loop is Node.js’s single-threaded mechanism for executing non-blocking asynchronous operations. It offloads I/O tasks (database calls, file uploads) to libuv worker threads and processes their callbacks from the event queue, allowing a single thread to handle thousands of concurrent requests."),

        ("Q6: What is the Virtual DOM in React?",
         "The Virtual DOM is a lightweight JavaScript representation of the actual browser DOM. When component state changes, React computes a diff between the old and new Virtual DOM (reconciliation) and updates only the specific changed nodes in the real DOM, ensuring high performance."),

        ("Q7: What are React Hooks, and which ones did you use?",
         "Hooks are functions that let functional components manage state and lifecycle features. In CleanLoop, we used `useState` for local UI state, `useEffect` for API fetching and map binding, `useContext` for global auth, `useNavigate` for routing, and `useRef` for Leaflet map instances."),

        ("Q8: How does Express handle routing?",
         "`express.Router()` creates modular, mountable route handlers. CleanLoop organizes routes by domain (`auth.routes.js`, `complaintRoutes.js`, `adminRoutes.js`) and mounts them under the `/api` prefix in `app.js`."),

        ("Q9: What is Express middleware?",
         "Middleware functions are functions that have access to the request object (`req`), response object (`res`), and the `next` function in the application’s request-response cycle. They perform tasks such as logging, parsing JSON, verifying JWT tokens, and checking user roles."),

        ("Q10: What is the purpose of npm and package.json?",
         "`package.json` defines project metadata, scripts (`start`, `build`, `test`), and dependency package versions. `npm` is the package manager that downloads and resolves transitive dependencies into `node_modules`."),

        ("Q11: How is user authentication implemented in CleanLoop?",
         "We implement stateless JWT (JSON Web Token) authentication. When a user logs in, Express verifies their bcrypt password hash and returns a signed bearer token. The React client stores this token in `localStorage` and transmits it in the `Authorization: Bearer <token>` header for all protected API calls."),

        ("Q12: Why shouldn't passwords be stored in plain text?",
         "If the database is breached, plain text passwords expose user credentials across multiple services. We use bcrypt with 10 salt rounds, which applies a slow, computationally expensive one-way cryptographic hash that is resistant to rainbow table and brute-force attacks."),

        ("Q13: What are the three parts of a JWT token?",
         "A JWT consists of Header (algorithm and token type, e.g. HMAC-SHA256), Payload (claims such as user ID, role, and expiration time), and Signature (hash of header and payload signed with the server's private `JWT_SECRET`)."),

        ("Q14: How does Role-Based Access Control (RBAC) work in your backend?",
         "Our `authorize(...allowedRoles)` middleware inspects `req.user.role` (populated by `authMiddleware`). If the role is not included in the allowed list, it halts execution and returns HTTP 403 Forbidden."),

        ("Q15: What is CORS, and how is it configured?",
         "Cross-Origin Resource Sharing (CORS) is a browser security mechanism that restricts cross-origin HTTP requests. In `app.js`, we configure CORS to dynamically authorize only approved origins (such as `https://cleanloop.vercel.app` and `http://localhost:5173`), blocking unauthorized third-party scripts."),

        ("Q16: How do you prevent brute-force attacks on the login route?",
         "We use `express-rate-limit` to restrict client IP addresses to 10 login attempts per 15-minute window on `/api/auth/login`. Exceeding this limit returns HTTP 429 Too Many Requests."),

        ("Q17: What does Express 'trust proxy' do, and why is it needed on Render?",
         "Render hosts applications behind a reverse proxy. By configuring `app.set('trust proxy', 1)`, Express trusts the reverse proxy headers (e.g. `X-Forwarded-For`), allowing our rate limiter and audit logs to capture the real client IP address rather than the proxy's internal IP."),

        ("Q18: What is the 2dsphere index in MongoDB?",
         "A `2dsphere` index supports queries that calculate geometries on an Earth-like sphere. It indexes GeoJSON coordinates (`Point`, `Polygon`) using S2 geometry cells, enabling fast geospatial distance queries and spatial aggregation."),

        ("Q19: Why does GeoJSON use [longitude, latitude] instead of [latitude, longitude]?",
         "GeoJSON follows the Cartesian coordinate standard where the horizontal axis (X) represents Longitude and the vertical axis (Y) represents Latitude: `[X, Y] = [lng, lat]`. Reversing the order causes spatial index errors in MongoDB."),

        ("Q20: What is document population in Mongoose?",
         "`populate()` is Mongoose's mechanism for replacing a referenced `ObjectId` in a document with the actual document from another collection (e.g. `complaint.populate('citizenId', 'name email')`), providing relational convenience without SQL JOIN overhead."),

        ("Q21: How do you prevent duplicate Green Points from being awarded?",
         "We enforce idempotency across three layers: (1) Admin verification requires status to be `awaiting_verification`; (2) A compound unique index on `PointsTransaction` `{ complaintId: 1, type: 1 }` prevents duplicate records; and (3) Ledger creation and balance increment occur within an atomic database transaction."),

        ("Q22: Why did you create a separate PointsTransaction collection instead of just updating user.pointsBalance?",
         "In financial and civic reward systems, an unalterable audit ledger is required. If a balance were simply overwritten, there would be no proof of when, why, or for which complaint points were credited. `PointsTransaction` maintains an immutable historical ledger."),

        ("Q23: Explain the 8 stages of the CleanLoop complaint lifecycle.",
         "`pending` (citizen reports) -> `under_review` (admin triages) -> `assigned` (collector dispatched) -> `accepted` (collector acknowledges) -> `in_progress` (remediation begins) -> `awaiting_verification` (evidence uploaded) -> `resolved` (admin verifies) -> Green Points credited."),

        ("Q24: Why can't a collector mark a complaint as resolved directly?",
         "Allowing collectors to mark complaints resolved reintroduces the ghost resolution problem where workers claim work was done without supervisory oversight. CleanLoop mandates independent admin verification of Before vs After photos before closure."),

        ("Q25: What happens when a complaint is rejected?",
         "An admin marks the complaint as `rejected` and supplies a mandatory administrative note (e.g. 'Duplicate report' or 'Not municipal jurisdiction'). The citizen is notified, and no crew is dispatched."),

        ("Q26: What is the Before & After comparison feature?",
         "It is a supervisory inspection modal that displays the citizen's original complaint photos side-by-side with the collector's cleanup evidence photos, allowing the supervisor to verify remediation quality before approving closure."),

        ("Q27: How does Multer handle image uploads without filling up server disk space?",
         "We use `multer.memoryStorage()`, which buffers incoming file streams in RAM. The buffer is validated and streamed directly to Cloudinary over HTTPS using `upload_stream`. No files are written to the server's local disk."),

        ("Q28: Why use Cloudinary instead of storing images in MongoDB?",
         "MongoDB documents have a 16MB limit. Storing binary images as Base64 strings bloats document size, exhausts memory, and destroys query performance. Cloudinary offloads media storage and provides a global CDN with automatic compression."),

        ("Q29: What is the difference between Supercluster clustering and Leaflet.heat heatmaps?",
         "Supercluster groups nearby individual point markers into interactive numeric cluster bubbles that expand on zoom for dispatch triage. Leaflet.heat computes continuous Gaussian density color gradients (green to red) to visualize chronic dumping intensity hotspots across wards."),

        ("Q30: How does the client communicate with the backend during file uploads?",
         "The React client bundles fields and image files into a standard `FormData` object and posts it via Axios with `Content-Type: multipart/form-data`. The browser automatically sets boundary markers for binary streaming."),

        ("Q31: How many automated tests were executed, and what did they verify?",
         "We executed 383 automated test assertions across 13 test suites covering database schemas (71), auth & RBAC (48), complaints (45), tracking (32), admin triage (33), collector execution (35), map analytics (27), rewards (34), E2E workflows (27), and deployment configs (18), achieving a 100% PASS rate."),

        ("Q32: What is the purpose of SPA rewrites in Vercel?",
         "In a Single Page Application, routing is handled on the client by React Router. When a user refreshes a deep link like `/dashboard` or `/complaint/123`, the web server would return a 404 because no physical file exists at that path. Vercel SPA rewrites route `/(.*)` to `/index.html`, allowing React Router to handle the route."),

        ("Q33: How do you handle Render's 30-second free-tier cold starts?",
         "We configured a 30-second (`timeout: 30000`) timeout in Axios to tolerate container spin-up latencies, configured `/api/health` and root health check aliases, and added a warm-up banner on the client."),

        ("Q34: How do you ensure environment secrets are not exposed to the public?",
         "All `.env` files are ignored by Git via `.gitignore`. We verified this with `git check-ignore`. Only sanitized `.env.example` templates containing placeholder values are committed to GitHub."),

        ("Q35: What happens if the notification service fails during complaint creation?",
         "Notification creation is wrapped in a dedicated try-catch block. If notification delivery fails, the error is logged, but the primary complaint transaction is not rolled back. Civic reporting is never blocked by alert delivery failures."),

        ("Q36: Why didn't you use WebSockets (Socket.io) for real-time notifications?",
         "CleanLoop's notification volume is event-driven rather than continuous. HTTP REST polling on page transitions and component mounts provides high reliability, avoids maintaining persistent WebSocket connections on sleeping free-tier servers, and reduces server memory usage. WebSockets are planned for future multi-city scaling."),

        ("Q37: What is the computational time complexity of geospatial indexing in MongoDB?",
         "MongoDB's 2dsphere index uses Google's S2 geometry library, which projects the sphere onto a cube and uses a Hilbert space-filling curve. Spatial lookups operate in approximately O(log N) time complexity compared to O(N) linear scans for unindexed coordinate comparisons."),

        ("Q38: What would happen if two administrators try to verify the same complaint simultaneously?",
         "The first request transitions the complaint status from `awaiting_verification` to `resolved` and writes the single `PointsTransaction` record. The second concurrent request fails the precondition status check (`status === 'awaiting_verification'`), returning HTTP 400 Bad Request with zero duplicate points awarded."),

        ("Q39: How does the application scale if 10,000 citizens submit complaints simultaneously?",
         "The decoupled architecture allows independent scaling: Vercel serves the static frontend globally across edge caches; Express API instances can scale horizontally behind a load balancer; MongoDB Atlas handles read replicas and sharding on geo-coordinates; and Cloudinary offloads image bandwidth completely."),

        ("Q40: What are the current limitations of the project?",
         "Current limitations include reliance on free-tier hosting with container cold starts, absence of automated AI waste classification (requiring manual citizen category selection), and lack of offline SMS reporting for citizens without smartphones. These are documented in our future scope."),

        ("Q41: How do you prevent users from tampering with their Green Points balance?",
         "`pointsBalance` cannot be updated directly via any client-facing API. The balance is incremented strictly on the server inside the protected admin verification controller as a result of an immutable `PointsTransaction` ledger write."),

        ("Q42: What is the purpose of bcrypt salt rounds?",
         "A salt is random cryptographic data added to the password before hashing. Salt rounds (e.g. 10 rounds = 2^10 iterations) determine the computational work factor. Even if two users choose identical passwords ('password123'), their resulting bcrypt hashes are completely distinct, preventing rainbow table attacks."),

        ("Q43: How do you handle image aspect ratio distortion in the Before/After modal?",
         "We use CSS `object-fit: cover` within fixed-dimension gallery cards, ensuring images maintain their natural aspect ratios without stretching, and provide a full-screen lightbox modal for unconstrained inspection."),

        ("Q44: Why did you choose Vite over Create React App (CRA)?",
         "Create React App uses Webpack, which bundles the entire application before starting the dev server, resulting in slow startup times. Vite uses native ES modules (ESM) in the browser and esbuild (written in Go) for pre-bundling, delivering sub-second hot-module replacement and faster production builds."),

        ("Q45: If you had to redesign one component of CleanLoop, what would it be?",
         "We would migrate to a background job queue (such as BullMQ with Redis) for Cloudinary streaming and notification dispatch, allowing the HTTP endpoint to return a 201 response in under 20ms while media processing occurs asynchronously in worker threads.")
    ]

    for q, a in viva_qa:
        story.append(Paragraph(q, style_q))
        story.append(Paragraph(a, style_a))

    # -------------------------------------------------------------------------
    # Build Document
    # -------------------------------------------------------------------------
    doc.build(story, canvasmaker=NumberedCanvas)
    file_size_kb = os.path.getsize(pdf_path) / 1024
    print(f"[SUCCESS] Complete CleanLoop Guide generated: {pdf_path} ({file_size_kb:.2f} KB)")

if __name__ == "__main__":
    build_pdf()
