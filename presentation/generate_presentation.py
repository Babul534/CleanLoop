"""
CleanLoop Project Presentation Generator
Generates a professional 10-slide PowerPoint presentation (.pptx)
adhering to CleanLoop's design tokens and actual implemented architecture.
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor

# -----------------------------------------------------------------------------
# Color Palette Tokens
# -----------------------------------------------------------------------------
COLOR_BG_IVORY = RGBColor(244, 241, 234)        # #F4F1EA - Main canvas
COLOR_DEEP_SLATE = RGBColor(38, 60, 56)         # #263C38 - Primary dark / headers
COLOR_FOREST_DARK = RGBColor(28, 48, 43)        # #1C302B - Dark cards / header bars
COLOR_SOFT_SAGE = RGBColor(169, 185, 172)       # #A9B9AC - Borders / muted pills
COLOR_MUTED_STONE = RGBColor(226, 221, 212)     # #E2DDD4 - Dividers / light accents
COLOR_RESTRAINED_LIME = RGBColor(135, 163, 48)  # #87A330 - Brand green / highlights
COLOR_LIME_LIGHT = RGBColor(232, 240, 210)      # Light lime pill
COLOR_WHITE = RGBColor(255, 255, 255)           # Card fill
COLOR_TEXT_MAIN = RGBColor(30, 42, 38)          # Body text dark
COLOR_TEXT_MUTED = RGBColor(95, 110, 105)       # Subtitles / captions
COLOR_CARD_BORDER = RGBColor(215, 210, 200)     # Subtle card border
COLOR_ACCENT_AMBER = RGBColor(217, 131, 36)     # Alert / warning
COLOR_ACCENT_BLUE = RGBColor(41, 128, 185)      # Technical / API

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6]

    # Helper: Add standard background
    def set_slide_background(slide, color=COLOR_BG_IVORY):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    # Helper: Add header block
    def add_header(slide, category_text, title_text, slide_number):
        # Header category pill
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(8.0), Inches(0.35))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        tf_cat.margin_left = tf_cat.margin_right = tf_cat.margin_top = tf_cat.margin_bottom = 0
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.name = "Calibri"
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = COLOR_RESTRAINED_LIME

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(10.5), Inches(0.65))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_right = tf_title.margin_top = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.name = "Georgia"
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_DEEP_SLATE

        # Slide Number Pill
        num_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(11.8), Inches(0.55), Inches(0.75), Inches(0.35))
        num_box.fill.solid()
        num_box.fill.fore_color.rgb = COLOR_WHITE
        num_box.line.color.rgb = COLOR_MUTED_STONE
        num_box.line.width = Pt(1)
        tf_num = num_box.text_frame
        p_num = tf_num.paragraphs[0]
        p_num.text = f"{slide_number:02d} / 10"
        p_num.font.name = "Calibri"
        p_num.font.size = Pt(10)
        p_num.font.bold = True
        p_num.font.color.rgb = COLOR_TEXT_MUTED
        p_num.alignment = PP_ALIGN.CENTER

    # Helper: Add standard footer
    def add_footer(slide):
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.0), Inches(11.733), Inches(0.3))
        tf = footer_box.text_frame
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = "CleanLoop • Smart Waste Management & Civic Remediation Platform | Academic Evaluation 2026"
        p.font.name = "Calibri"
        p.font.size = Pt(9.5)
        p.font.color.rgb = COLOR_TEXT_MUTED

    # Helper: Add rounded card
    def add_card(slide, left, top, width, height, fill_color=COLOR_WHITE, border_color=COLOR_CARD_BORDER, border_width=1):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = fill_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(border_width)
        else:
            card.line.fill.background()
        return card

    # =========================================================================
    # SLIDE 1: Title Slide (Cover)
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide1, COLOR_BG_IVORY)

    # Decorative top bar
    top_bar = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, Inches(0.15))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = COLOR_DEEP_SLATE
    top_bar.line.fill.background()

    # Brand badge
    badge = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.6), Inches(4.5), Inches(0.38))
    badge.fill.solid()
    badge.fill.fore_color.rgb = COLOR_WHITE
    badge.line.color.rgb = COLOR_MUTED_STONE
    tf_b = badge.text_frame
    p_b = tf_b.paragraphs[0]
    p_b.text = "● CIVIC SANITATION  ● SMART STEWARDSHIP  ● CLOSED-LOOP"
    p_b.font.name = "Calibri"
    p_b.font.size = Pt(9)
    p_b.font.bold = True
    p_b.font.color.rgb = COLOR_DEEP_SLATE

    # Main Project Title
    title_box = slide1.shapes.add_textbox(Inches(0.8), Inches(1.2), Inches(11.5), Inches(1.3))
    tf_t = title_box.text_frame
    tf_t.word_wrap = True
    p_t1 = tf_t.paragraphs[0]
    p_t1.text = "CleanLoop"
    p_t1.font.name = "Georgia"
    p_t1.font.size = Pt(46)
    p_t1.font.bold = True
    p_t1.font.color.rgb = COLOR_DEEP_SLATE

    p_t2 = tf_t.add_paragraph()
    p_t2.text = "Smart Waste Management & Civic Remediation System"
    p_t2.font.name = "Calibri"
    p_t2.font.size = Pt(22)
    p_t2.font.bold = True
    p_t2.font.color.rgb = COLOR_RESTRAINED_LIME

    # Tagline Card
    tagline_box = slide1.shapes.add_textbox(Inches(0.8), Inches(2.6), Inches(11.5), Inches(0.5))
    tf_tag = tagline_box.text_frame
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = "\"Small Actions. Cleaner Streets. Better Tomorrow.\""
    p_tag.font.name = "Georgia"
    p_tag.font.size = Pt(15)
    p_tag.font.italic = True
    p_tag.font.color.rgb = COLOR_TEXT_MUTED

    # Two Main Cards: Team Details & Academic Evaluation
    # Left: Team Members Card
    add_card(slide1, 0.8, 3.3, 5.7, 3.4, COLOR_WHITE, COLOR_MUTED_STONE, 1.5)

    header_left = slide1.shapes.add_textbox(Inches(1.1), Inches(3.5), Inches(5.1), Inches(0.4))
    tf_hl = header_left.text_frame
    p_hl = tf_hl.paragraphs[0]
    p_hl.text = "PROJECT TEAM MEMBERS"
    p_hl.font.name = "Calibri"
    p_hl.font.size = Pt(12)
    p_hl.font.bold = True
    p_hl.font.color.rgb = COLOR_DEEP_SLATE

    # Member list
    members = [
        ("Bhuthukuri Sunitha", "241FA04492", "Frontend & UI Engineering / State Architecture"),
        ("Babul Kumar", "241FA04534", "Backend REST APIs, Database & Cloud Deployment"),
        ("Ayush Kumar", "241FA04552", "Civic Workflows, Verification Audit & Gamification")
    ]

    for idx, (name, roll, role) in enumerate(members):
        y_pos = 4.0 + (idx * 0.82)
        # Dot accent
        dot = slide1.shapes.add_shape(MSO_SHAPE.OVAL, Inches(1.15), Inches(y_pos + 0.05), Inches(0.14), Inches(0.14))
        dot.fill.solid()
        dot.fill.fore_color.rgb = COLOR_RESTRAINED_LIME
        dot.line.fill.background()

        m_box = slide1.shapes.add_textbox(Inches(1.4), Inches(y_pos), Inches(4.8), Inches(0.75))
        tf_m = m_box.text_frame
        tf_m.margin_left = tf_m.margin_right = tf_m.margin_top = tf_m.margin_bottom = 0
        p_m1 = tf_m.paragraphs[0]
        p_m1.text = f"{name}   ({roll})"
        p_m1.font.name = "Calibri"
        p_m1.font.size = Pt(13)
        p_m1.font.bold = True
        p_m1.font.color.rgb = COLOR_TEXT_MAIN

        p_m2 = tf_m.add_paragraph()
        p_m2.text = role
        p_m2.font.name = "Calibri"
        p_m2.font.size = Pt(10)
        p_m2.font.color.rgb = COLOR_TEXT_MUTED

    # Right: Academic & Institutional Guidance Card
    add_card(slide1, 6.8, 3.3, 5.7, 3.4, COLOR_WHITE, COLOR_MUTED_STONE, 1.5)

    header_right = slide1.shapes.add_textbox(Inches(7.1), Inches(3.5), Inches(5.1), Inches(0.4))
    tf_hr = header_right.text_frame
    p_hr = tf_hr.paragraphs[0]
    p_hr.text = "ACADEMIC & INSTITUTIONAL GUIDANCE"
    p_hr.font.name = "Calibri"
    p_hr.font.size = Pt(12)
    p_hr.font.bold = True
    p_hr.font.color.rgb = COLOR_DEEP_SLATE

    guide_box = slide1.shapes.add_textbox(Inches(7.1), Inches(4.0), Inches(5.1), Inches(2.5))
    tf_g = guide_box.text_frame
    tf_g.word_wrap = True

    p_g1 = tf_g.paragraphs[0]
    p_g1.text = "Project Guide:"
    p_g1.font.name = "Calibri"
    p_g1.font.size = Pt(11)
    p_g1.font.bold = True
    p_g1.font.color.rgb = COLOR_TEXT_MUTED

    p_g2 = tf_g.add_paragraph()
    p_g2.text = "[Faculty Guide Name, Designation / Department]"
    p_g2.font.name = "Calibri"
    p_g2.font.size = Pt(13)
    p_g2.font.bold = True
    p_g2.font.color.rgb = COLOR_DEEP_SLATE

    p_g3 = tf_g.add_paragraph()
    p_g3.text = "\nAcademic Department & Institution:"
    p_g3.font.name = "Calibri"
    p_g3.font.size = Pt(11)
    p_g3.font.bold = True
    p_g3.font.color.rgb = COLOR_TEXT_MUTED

    p_g4 = tf_g.add_paragraph()
    p_g4.text = "Department of Computer Science & Engineering\n[University / College Name]"
    p_g4.font.name = "Calibri"
    p_g4.font.size = Pt(12.5)
    p_g4.font.color.rgb = COLOR_TEXT_MAIN

    p_g5 = tf_g.add_paragraph()
    p_g5.text = "B.Tech Final Project Evaluation • Academic Year 2026"
    p_g5.font.name = "Calibri"
    p_g5.font.size = Pt(10.5)
    p_g5.font.italic = True
    p_g5.font.color.rgb = COLOR_RESTRAINED_LIME

    # =========================================================================
    # SLIDE 2: Introduction and Problem Statement
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide2)
    add_header(slide2, "01. Context & Motivation", "Urban Waste Bottlenecks & The Broken Civic Loop", 2)
    add_footer(slide2)

    # Left Column: The Problem Reality
    add_card(slide2, 0.8, 1.5, 5.7, 4.3, COLOR_WHITE)
    left_title = slide2.shapes.add_textbox(Inches(1.1), Inches(1.7), Inches(5.1), Inches(0.4))
    left_title.text_frame.paragraphs[0].text = "CHALLENGES IN TRADITIONAL REPORTING"
    left_title.text_frame.paragraphs[0].font.name = "Calibri"
    left_title.text_frame.paragraphs[0].font.size = Pt(12)
    left_title.text_frame.paragraphs[0].font.bold = True
    left_title.text_frame.paragraphs[0].font.color.rgb = COLOR_ACCENT_AMBER

    points_problem = [
        ("Vague Location Data", "Complaints filed via phone calls or physical registers lack geo-coordinates, leaving collectors searching blindly for dump sites."),
        ("Ghost Resolutions", "Field workers mark complaints 'resolved' without photographic evidence, leaving citizens frustrated with uncollected waste."),
        ("Zero Civic Transparency", "Citizens cannot track the lifecycle of their complaints, creating mistrust between citizens and municipal authorities."),
        ("Manual Dispatch Latency", "Supervisors rely on spreadsheets to manually assign tasks, causing response delays ranging from days to weeks.")
    ]

    for i, (title, desc) in enumerate(points_problem):
        y = 2.2 + (i * 0.85)
        box = slide2.shapes.add_textbox(Inches(1.1), Inches(y), Inches(5.1), Inches(0.75))
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = f"•  {title}"
        p1.font.name = "Calibri"
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_TEXT_MAIN
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = "Calibri"
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    # Right Column: The CleanLoop Solution
    add_card(slide2, 6.8, 1.5, 5.7, 4.3, COLOR_FOREST_DARK, None)
    right_title = slide2.shapes.add_textbox(Inches(7.1), Inches(1.7), Inches(5.1), Inches(0.4))
    right_title.text_frame.paragraphs[0].text = "THE CLEANLOOP CLOSED-LOOP PARADIGM"
    right_title.text_frame.paragraphs[0].font.name = "Calibri"
    right_title.text_frame.paragraphs[0].font.size = Pt(12)
    right_title.text_frame.paragraphs[0].font.bold = True
    right_title.text_frame.paragraphs[0].font.color.rgb = COLOR_RESTRAINED_LIME

    points_solution = [
        ("Geo-Referenced Pinpointing", "High-accuracy GPS detection and interactive OpenStreetMap pin-drop eliminates location ambiguity."),
        ("Mandatory Before/After Proof", "Remediation requires photographic evidence from collectors, verified by supervisors before closure."),
        ("Multi-Stage Live Tracking", "Citizens receive real-time notifications and an interactive 5-stage timeline from intake to resolution."),
        ("Incentivized Civic Action", "Green Points reward ledger gamifies reporting, converting passive citizens into active environmental stewards.")
    ]

    for i, (title, desc) in enumerate(points_solution):
        y = 2.2 + (i * 0.85)
        box = slide2.shapes.add_textbox(Inches(7.1), Inches(y), Inches(5.1), Inches(0.75))
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = f"✔  {title}"
        p1.font.name = "Calibri"
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_WHITE
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = "Calibri"
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_SOFT_SAGE

    # Bottom Callout
    bot_card = add_card(slide2, 0.8, 6.0, 11.7, 0.8, COLOR_WHITE, COLOR_RESTRAINED_LIME, 1.5)
    bot_box = slide2.shapes.add_textbox(Inches(1.0), Inches(6.1), Inches(11.3), Inches(0.6))
    tf_bot = bot_box.text_frame
    p_b1 = tf_bot.paragraphs[0]
    p_b1.text = "Key Takeaway: CleanLoop shifts municipal sanitation from an unmonitored reactive burden to a transparent, digitally orchestrated, and community-verified civic ecosystem."
    p_b1.font.name = "Georgia"
    p_b1.font.size = Pt(11.5)
    p_b1.font.bold = True
    p_b1.font.color.rgb = COLOR_DEEP_SLATE

    # =========================================================================
    # SLIDE 3: Project Objectives
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide3)
    add_header(slide3, "02. Strategic Goals", "Project Objectives & Architectural Mission", 3)
    add_footer(slide3)

    objectives = [
        ("1. Digital Intake", "Empower citizens to log waste incidents with photos, category, and severity in under 60 seconds across desktop and mobile devices."),
        ("2. Spatial Intelligence", "Capture exact coordinates via device GPS and interactive OpenStreetMap pin placement with 2dsphere geospatial indexing."),
        ("3. Municipal Triage", "Provide administrators with an operational command center to prioritize critical reports and assign available sanitation collectors."),
        ("4. Evidence-Based Verification", "Enforce supervisory comparison of citizen 'Before' photographs against collector 'After' photographs prior to complaint closure."),
        ("5. Closed-Loop Tracking", "Deliver end-to-end transparency with multi-stage status history, timestamps, and real-time in-app notifications."),
        ("6. Civic Gamification", "Reward citizen contributions through an immutable Green Points ledger, unlockable milestone badges, and civic leaderboards.")
    ]

    for idx, (title, desc) in enumerate(objectives):
        col = idx % 3
        row = idx // 3
        x = 0.8 + (col * 4.0)
        y = 1.6 + (row * 2.5)

        add_card(slide3, x, y, 3.75, 2.3, COLOR_WHITE, COLOR_MUTED_STONE, 1.2)

        # Header tag
        tag = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x + 0.25), Inches(y + 0.25), Inches(0.4), Inches(0.4))
        tag.fill.solid()
        tag.fill.fore_color.rgb = COLOR_LIME_LIGHT
        tag.line.fill.background()
        tf_tag = tag.text_frame
        p_t = tf_tag.paragraphs[0]
        p_t.text = str(idx + 1)
        p_t.font.name = "Calibri"
        p_t.font.size = Pt(12)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_DEEP_SLATE
        p_t.alignment = PP_ALIGN.CENTER

        # Title
        t_box = slide3.shapes.add_textbox(Inches(x + 0.8), Inches(y + 0.25), Inches(2.7), Inches(0.4))
        tf_t = t_box.text_frame
        tf_t.margin_left = tf_t.margin_right = tf_t.margin_top = tf_t.margin_bottom = 0
        p_title = tf_t.paragraphs[0]
        p_title.text = title.split(". ")[1]
        p_title.font.name = "Calibri"
        p_title.font.size = Pt(13)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_DEEP_SLATE

        # Desc
        d_box = slide3.shapes.add_textbox(Inches(x + 0.25), Inches(y + 0.8), Inches(3.25), Inches(1.3))
        tf_d = d_box.text_frame
        tf_d.word_wrap = True
        tf_d.margin_left = tf_d.margin_right = tf_d.margin_top = tf_d.margin_bottom = 0
        p_desc = tf_d.paragraphs[0]
        p_desc.text = desc
        p_desc.font.name = "Calibri"
        p_desc.font.size = Pt(10.5)
        p_desc.font.color.rgb = COLOR_TEXT_MUTED

    # =========================================================================
    # SLIDE 4: Technologies and Tools Used
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide4)
    add_header(slide4, "03. Engineering Stack", "Modern Full-Stack MERN & Cloud Architecture", 4)
    add_footer(slide4)

    tech_categories = [
        ("Frontend Client", COLOR_DEEP_SLATE, [
            ("React 18 & Vite 6", "Modern functional component architecture with fast HMR builds"),
            ("React Router DOM 6", "Client-side routing with authenticated role guards"),
            ("Leaflet & Supercluster", "Interactive maps with client-side geospatial clustering"),
            ("Lucide React Icons", "Clean, accessible iconography across all dashboards"),
            ("CleanLoop CSS Tokens", "Bespoke Warm Ivory & Deep Slate responsive theme")
        ]),
        ("Backend Services", COLOR_DEEP_SLATE, [
            ("Node.js & Express.js", "Asynchronous MVC REST API engine and route middleware"),
            ("JWT & bcryptjs", "Stateless bearer token auth and salted password hashing"),
            ("Helmet & CORS", "HTTP security headers and origin-whitelisting guards"),
            ("Express Rate Limit", "Protects public authentication and intake routes"),
            ("Multer & MemoryStorage", "Stream-based multipart media parsing and validation")
        ]),
        ("Database & Media", COLOR_DEEP_SLATE, [
            ("MongoDB Atlas", "M0 multi-region cloud cluster with high availability"),
            ("Mongoose 8 ODM", "Strict document schemas, validation hooks & 2dsphere indexes"),
            ("Cloudinary CDN", "Secure multipart photographic storage and thumbnail transforms"),
            ("OpenStreetMap Tiles", "High-reliability public geographic tile rendering")
        ]),
        ("DevOps & Production", COLOR_DEEP_SLATE, [
            ("Vercel Edge Network", "Global CDN hosting frontend SPA with rewrite rules"),
            ("Render Cloud Platform", "Node.js web service running with reverse proxy support"),
            ("Git & GitHub", "Strict version control and clean commit tracking"),
            ("Automated Audit Suites", "383 automated assertions covering Phase 2-10 features")
        ])
    ]

    for idx, (cat_title, color, items) in enumerate(tech_categories):
        x = 0.8 + (idx * 2.95)
        add_card(slide4, x, 1.5, 2.8, 5.2, COLOR_WHITE, COLOR_MUTED_STONE, 1.2)

        # Header pill
        h_box = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x + 0.15), Inches(1.65), Inches(2.5), Inches(0.45))
        h_box.fill.solid()
        h_box.fill.fore_color.rgb = COLOR_FOREST_DARK
        h_box.line.fill.background()
        tf_h = h_box.text_frame
        p_h = tf_h.paragraphs[0]
        p_h.text = cat_title.upper()
        p_h.font.name = "Calibri"
        p_h.font.size = Pt(11)
        p_h.font.bold = True
        p_h.font.color.rgb = COLOR_RESTRAINED_LIME
        p_h.alignment = PP_ALIGN.CENTER

        # Tech items
        for j, (t_name, t_sub) in enumerate(items):
            y_item = 2.3 + (j * 0.92)
            ibox = slide4.shapes.add_textbox(Inches(x + 0.2), Inches(y_item), Inches(2.4), Inches(0.85))
            tf_i = ibox.text_frame
            tf_i.word_wrap = True
            tf_i.margin_left = tf_i.margin_right = tf_i.margin_top = tf_i.margin_bottom = 0
            p1 = tf_i.paragraphs[0]
            p1.text = t_name
            p1.font.name = "Calibri"
            p1.font.size = Pt(11.5)
            p1.font.bold = True
            p1.font.color.rgb = COLOR_TEXT_MAIN
            p2 = tf_i.add_paragraph()
            p2.text = t_sub
            p2.font.name = "Calibri"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = COLOR_TEXT_MUTED

    # =========================================================================
    # SLIDE 5: System Architecture and Workflow
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide5)
    add_header(slide5, "04. Architecture & Workflow", "Multi-Tier Infrastructure & Closed-Loop Lifecycle", 5)
    add_footer(slide5)

    # Top Section: 3-Tier System Architecture Diagram
    add_card(slide5, 0.8, 1.5, 11.733, 2.5, COLOR_WHITE, COLOR_MUTED_STONE, 1.2)

    tier_title = slide5.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.3), Inches(0.35))
    tier_title.text_frame.paragraphs[0].text = "SYSTEM ARCHITECTURE TOPOLOGY"
    tier_title.text_frame.paragraphs[0].font.name = "Calibri"
    tier_title.text_frame.paragraphs[0].font.size = Pt(11)
    tier_title.text_frame.paragraphs[0].font.bold = True
    tier_title.text_frame.paragraphs[0].font.color.rgb = COLOR_DEEP_SLATE

    tiers = [
        ("1. Presentation Tier (Vercel Edge)", "React 18 SPA + Vite 6\n• Citizen Portal (Report & Track)\n• Municipal Command Console\n• Field Collector Interface\n• React Leaflet Map UI"),
        ("2. Application Tier (Render API)", "Node.js + Express.js API\n• JWT Auth & RBAC Middleware\n• Multi-Stage Lifecycle Engine\n• Rate Limiter & File Validator\n• Idempotent Green Points Engine"),
        ("3. Data & Storage Tier (Cloud)", "MongoDB Atlas + Cloudinary\n• Mongoose Relational Models\n• 2dsphere Geospatial Indexes\n• Cloudinary Image Hosting\n• OpenStreetMap Tile Service")
    ]

    for idx, (title, content) in enumerate(tiers):
        x = 1.1 + (idx * 3.8)
        card = add_card(slide5, x, 2.0, 3.5, 1.8, COLOR_BG_IVORY, COLOR_MUTED_STONE, 1)
        tb = slide5.shapes.add_textbox(Inches(x + 0.15), Inches(2.1), Inches(3.2), Inches(1.6))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.name = "Calibri"
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DEEP_SLATE

        p2 = tf.add_paragraph()
        p2.text = content
        p2.font.name = "Calibri"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    # Bottom Section: The 8-Stage Complaint Lifecycle
    add_card(slide5, 0.8, 4.2, 11.733, 2.5, COLOR_FOREST_DARK, None)

    life_title = slide5.shapes.add_textbox(Inches(1.0), Inches(4.35), Inches(11.3), Inches(0.35))
    life_title.text_frame.paragraphs[0].text = "THE 8-STAGE CLOSED-LOOP COMPLAINT LIFECYCLE"
    life_title.text_frame.paragraphs[0].font.name = "Calibri"
    life_title.text_frame.paragraphs[0].font.size = Pt(11)
    life_title.text_frame.paragraphs[0].font.bold = True
    life_title.text_frame.paragraphs[0].font.color.rgb = COLOR_RESTRAINED_LIME

    stages = [
        ("1. Citizen Reports", "Photo, GPS, Category\nStatus: 'pending'"),
        ("2. Admin Triage", "Priority & Verification\nStatus: 'under_review'"),
        ("3. Crew Dispatch", "Collector Assigned\nStatus: 'assigned'"),
        ("4. Crew Accepts", "Task Acknowledged\nStatus: 'accepted'"),
        ("5. Remediation", "On-site Cleanup\nStatus: 'in_progress'"),
        ("6. Evidence Sub.", "After-photos Uploaded\nStatus: 'awaiting_verif'"),
        ("7. Admin Audited", "Before/After Verified\nStatus: 'resolved'"),
        ("8. Rewards Paid", "Green Points Ledger\n+ Badges Unlocked")
    ]

    for idx, (st_name, st_desc) in enumerate(stages):
        x = 1.0 + (idx * 1.42)
        stage_card = add_card(slide5, x, 4.8, 1.32, 1.65, COLOR_DEEP_SLATE, COLOR_SOFT_SAGE, 1)
        tb = slide5.shapes.add_textbox(Inches(x + 0.08), Inches(4.88), Inches(1.16), Inches(1.5))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = st_name
        p1.font.name = "Calibri"
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_WHITE

        p2 = tf.add_paragraph()
        p2.text = st_desc
        p2.font.name = "Calibri"
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = COLOR_SOFT_SAGE

    # =========================================================================
    # SLIDE 6: Features and Functionalities
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide6)
    add_header(slide6, "05. System Capabilities", "Core Modules & Role-Based Functionalities", 6)
    add_footer(slide6)

    modules = [
        ("Citizen Portal", COLOR_DEEP_SLATE, [
            ("Frictionless Reporting", "Instant intake with image uploads, waste category selection, and severity levels."),
            ("Dual-Mode Geolocation", "High-precision GPS auto-detection or interactive manual pin placement on OpenStreetMap."),
            ("Live Status Timeline", "Interactive 5-stage visual tracker with municipal action logs and supervisor notes."),
            ("Notification Center", "In-app notifications for report confirmation, assignment dispatch, and verified resolution.")
        ]),
        ("Municipal Command Center", COLOR_DEEP_SLATE, [
            ("Operational KPI Dashboard", "Real-time metrics: Total Reports, Pending Triage, Active Field Work, Resolved."),
            ("Spatial Triage & Clustering", "Interactive city map with dynamic marker clustering and kernel density heatmaps."),
            ("Sanitation Fleet Dispatch", "Real-time collector roster management, workload balancing, and one-click task assignment."),
            ("Comprehensive Audit Log", "Immutable audit trail recording every state change, timestamp, and actor identity.")
        ]),
        ("Sanitation Collector Console", COLOR_DEEP_SLATE, [
            ("Mobile-Optimized Queue", "Task list prioritizing assigned incidents with direct location navigation."),
            ("Two-Step Task Progression", "Accept task to notify command center, then mark 'In Progress' upon arrival on-site."),
            ("Cleanup Evidence Upload", "Direct camera upload of 'After' remediation photographs and field notes."),
            ("Task History Ledger", "Personal completion metrics tracking total cleanups performed.")
        ]),
        ("Supervisory Audit & Rewards", COLOR_DEEP_SLATE, [
            ("Before/After Comparison", "Side-by-side photo comparison modal allowing supervisors to inspect cleanup quality."),
            ("One-Click Verification", "Transitions complaint to 'resolved' and assignment to 'verified' with audit timestamps."),
            ("Green Points Ledger", "Awards +50 to +100 Green Points with strict atomic idempotency protection against duplicate payouts."),
            ("Civic Badges & Leaderboard", "Automatic milestone badge unlocks and privacy-safe civic leaderboard rankings.")
        ])
    ]

    for idx, (mod_title, col, items) in enumerate(modules):
        col_idx = idx % 2
        row_idx = idx // 2
        x = 0.8 + (col_idx * 5.95)
        y = 1.5 + (row_idx * 2.65)

        add_card(slide6, x, y, 5.75, 2.45, COLOR_WHITE, COLOR_MUTED_STONE, 1.2)

        # Header Pill
        hp = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x + 0.2), Inches(y + 0.2), Inches(5.35), Inches(0.38))
        hp.fill.solid()
        hp.fill.fore_color.rgb = COLOR_FOREST_DARK
        hp.line.fill.background()
        tf_hp = hp.text_frame
        p_hp = tf_hp.paragraphs[0]
        p_hp.text = mod_title.upper()
        p_hp.font.name = "Calibri"
        p_hp.font.size = Pt(11)
        p_hp.font.bold = True
        p_hp.font.color.rgb = COLOR_RESTRAINED_LIME

        for j, (f_title, f_desc) in enumerate(items):
            yj = y + 0.68 + (j * 0.42)
            tb = slide6.shapes.add_textbox(Inches(x + 0.25), Inches(yj), Inches(5.25), Inches(0.4))
            tf = tb.text_frame
            tf.word_wrap = True
            tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
            p = tf.paragraphs[0]
            p.text = f"• {f_title}: "
            p.font.name = "Calibri"
            p.font.size = Pt(9.5)
            p.font.bold = True
            p.font.color.rgb = COLOR_TEXT_MAIN

            run = p.add_run()
            run.text = f_desc
            run.font.bold = False
            run.font.color.rgb = COLOR_TEXT_MUTED

    # =========================================================================
    # SLIDE 7: Database Design and API Integration
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide7)
    add_header(slide7, "06. Data Architecture & APIs", "Mongoose Document Schemas & REST API Endpoints", 7)
    add_footer(slide7)

    # Left: Database Schemas
    add_card(slide7, 0.8, 1.5, 5.7, 5.2, COLOR_WHITE, COLOR_MUTED_STONE, 1.2)
    left_h = slide7.shapes.add_textbox(Inches(1.0), Inches(1.65), Inches(5.3), Inches(0.35))
    left_h.text_frame.paragraphs[0].text = "CORE MONGOOSE SCHEMAS & RELATIONSHIPS"
    left_h.text_frame.paragraphs[0].font.name = "Calibri"
    left_h.text_frame.paragraphs[0].font.size = Pt(11)
    left_h.text_frame.paragraphs[0].font.bold = True
    left_h.text_frame.paragraphs[0].font.color.rgb = COLOR_DEEP_SLATE

    schemas = [
        ("User Model", "name, email, passwordHash, role: ['user','admin','collector'], pointsBalance, phone, address"),
        ("Complaint Model", "title, category, priority, status, location: { type: 'Point', coordinates: [lng, lat] }, images: [{ url, publicId }], citizenId (ref: User), statusHistory: [{ status, changedAt, changedBy }]"),
        ("Assignment Model", "complaintId (ref: Complaint), collectorId (ref: User), status: ['assigned','accepted','in_progress','submitted_for_verification','verified'], evidencePhotos: [{ url, publicId }], completionNotes"),
        ("PointsTransaction Model", "citizenId (ref: User), complaintId (ref: Complaint), points, type: 'credit', reason, balanceAfter, timestamp (Immutable Ledger)"),
        ("UserBadge & Notification", "userId, badgeId, unlockedAt | recipient, title, message, type, isRead, link")
    ]

    for idx, (s_name, s_fields) in enumerate(schemas):
        y = 2.1 + (idx * 0.9)
        tb = slide7.shapes.add_textbox(Inches(1.0), Inches(y), Inches(5.3), Inches(0.85))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = f"■  {s_name}"
        p1.font.name = "Calibri"
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DEEP_SLATE

        p2 = tf.add_paragraph()
        p2.text = s_fields
        p2.font.name = "Consolas"
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    # Right: Representative REST APIs
    add_card(slide7, 6.8, 1.5, 5.7, 5.2, COLOR_FOREST_DARK, None)
    right_h = slide7.shapes.add_textbox(Inches(7.0), Inches(1.65), Inches(5.3), Inches(0.35))
    right_h.text_frame.paragraphs[0].text = "ACTUAL RESTFUL API ENDPOINT ARCHITECTURE"
    right_h.text_frame.paragraphs[0].font.name = "Calibri"
    right_h.text_frame.paragraphs[0].font.size = Pt(11)
    right_h.text_frame.paragraphs[0].font.bold = True
    right_h.text_frame.paragraphs[0].font.color.rgb = COLOR_RESTRAINED_LIME

    apis = [
        ("POST /api/auth/register & /login", "Public registration, bcrypt hash comparison, JWT issue (24h expiry)"),
        ("POST /api/complaints", "Authenticated citizen incident submission with Cloudinary image uploads"),
        ("GET /api/complaints/my", "Retrieves paginated personal complaint history with status filters"),
        ("GET /api/admin/complaints", "Admin dashboard triage queue with status, priority, and date sorting"),
        ("POST /api/admin/assignments", "Dispatches sanitation crew and syncs complaint to 'assigned'"),
        ("PATCH /api/collector/assignments/:id/submit", "Collector submits cleanup evidence photos and field remediation notes"),
        ("PATCH /api/admin/complaints/:id/verify-resolution", "Supervisory verification: sets 'resolved', credits Green Points atomically"),
        ("GET /api/rewards/leaderboard", "Public civic ranking with masked identities and privacy guards"),
        ("GET /api/complaints/public/impact", "Public counter fetching live statistics directly from MongoDB Atlas")
    ]

    for idx, (route, detail) in enumerate(apis):
        y = 2.05 + (idx * 0.5)
        tb = slide7.shapes.add_textbox(Inches(7.0), Inches(y), Inches(5.3), Inches(0.48))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = route
        p1.font.name = "Consolas"
        p1.font.size = Pt(9.5)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_RESTRAINED_LIME

        p2 = tf.add_paragraph()
        p2.text = detail
        p2.font.name = "Calibri"
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = COLOR_SOFT_SAGE

    # =========================================================================
    # SLIDE 8: Screenshots of the Project (Using User's Actual Application Screens)
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide8)
    add_header(slide8, "07. Interface Demonstration", "Live Application Screenshots & Operational UI", 8)
    add_footer(slide8)

    # 3 Real Screenshots Side by Side
    screenshots = [
        ("homepage.jpg", "PUBLIC CIVIC PORTAL", "Hero illustration, brand tagline, instant CTA navigation", 0.8),
        ("admin_dashboard.jpg", "MUNICIPAL COMMAND CENTER", "Operational KPIs, spatial triage, fleet status & audit ledger", 4.75),
        ("user_dashboard.jpg", "CITIZEN DASHBOARD & REWARDS", "50 Green Points balance, report metrics, live status tracking", 8.7)
    ]

    for filename, title, subtitle, x_pos in screenshots:
        card = add_card(slide8, x_pos, 1.5, 3.8, 4.3, COLOR_WHITE, COLOR_MUTED_STONE, 1.2)

        # Title block
        t_box = slide8.shapes.add_textbox(Inches(x_pos + 0.15), Inches(1.6), Inches(3.5), Inches(0.55))
        tf = t_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.name = "Calibri"
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DEEP_SLATE

        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.name = "Calibri"
        p2.font.size = Pt(9)
        p2.font.color.rgb = COLOR_TEXT_MUTED

        # Screenshot Image
        img_path = os.path.join("presentation", "screenshots", filename)
        if os.path.exists(img_path):
            slide8.shapes.add_picture(img_path, Inches(x_pos + 0.15), Inches(2.25), width=Inches(3.5), height=Inches(3.35))
        else:
            # Fallback placeholder box
            f_box = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x_pos + 0.15), Inches(2.25), Inches(3.5), Inches(3.35))
            f_box.fill.solid()
            f_box.fill.fore_color.rgb = COLOR_BG_IVORY

    # Bottom Highlights Pill Card
    h_card = add_card(slide8, 0.8, 6.0, 11.733, 0.8, COLOR_FOREST_DARK, None)
    h_box = slide8.shapes.add_textbox(Inches(1.0), Inches(6.1), Inches(11.3), Inches(0.6))
    tf_h = h_box.text_frame
    p_h = tf_h.paragraphs[0]
    p_h.text = "Key UI Innovations: Side-by-side Before/After photo comparison modal • Dynamic OpenStreetMap clustering • 5-Stage live status timeline • Mobile-first responsive navigation"
    p_h.font.name = "Calibri"
    p_h.font.size = Pt(10.5)
    p_h.font.bold = True
    p_h.font.color.rgb = COLOR_RESTRAINED_LIME
    p_h.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 9: Challenges Faced and Future Scope
    # =========================================================================
    slide9 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide9)
    add_header(slide9, "08. Engineering & Roadmap", "Key Challenges Overcome & Future Project Horizons", 9)
    add_footer(slide9)

    # Left: Challenges Overcome
    add_card(slide9, 0.8, 1.5, 5.7, 5.2, COLOR_WHITE, COLOR_MUTED_STONE, 1.2)
    left_h9 = slide9.shapes.add_textbox(Inches(1.1), Inches(1.7), Inches(5.1), Inches(0.4))
    left_h9.text_frame.paragraphs[0].text = "ENGINEERING CHALLENGES OVERCOME"
    left_h9.text_frame.paragraphs[0].font.name = "Calibri"
    left_h9.text_frame.paragraphs[0].font.size = Pt(12)
    left_h9.text_frame.paragraphs[0].font.bold = True
    left_h9.text_frame.paragraphs[0].font.color.rgb = COLOR_DEEP_SLATE

    challenges = [
        ("Atomic Reward Idempotency", "Preventing duplicate Green Point credits when admins clicked verification repeatedly. Solved with database constraints, audit status gates, and single-credit checks."),
        ("Multi-Role Access Control (RBAC)", "Managing 3 distinct user scopes (Citizen, Admin, Collector) without route bleeding. Implemented modular JWT middleware and React route guards."),
        ("Geospatial Clustering Performance", "Rendering hundreds of incident pins caused DOM lag. Solved by integrating Supercluster on top of Leaflet for fluid multi-level zoom clustering."),
        ("Cloud Cold-Start Resilience", "Render free-tier instances sleep after inactivity. Implemented 30s frontend timeout handling, health check aliases, and Express trust-proxy configs.")
    ]

    for idx, (title, desc) in enumerate(challenges):
        y = 2.2 + (idx * 1.05)
        tb = slide9.shapes.add_textbox(Inches(1.1), Inches(y), Inches(5.1), Inches(0.95))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = f"✔  {title}"
        p1.font.name = "Calibri"
        p1.font.size = Pt(11.5)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DEEP_SLATE
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = "Calibri"
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    # Right: Future Scope
    add_card(slide9, 6.8, 1.5, 5.7, 5.2, COLOR_FOREST_DARK, None)
    right_h9 = slide9.shapes.add_textbox(Inches(7.1), Inches(1.7), Inches(5.1), Inches(0.4))
    right_h9.text_frame.paragraphs[0].text = "FUTURE EXPANSION & HORIZONS"
    right_h9.text_frame.paragraphs[0].font.name = "Calibri"
    right_h9.text_frame.paragraphs[0].font.size = Pt(12)
    right_h9.text_frame.paragraphs[0].font.bold = True
    right_h9.text_frame.paragraphs[0].font.color.rgb = COLOR_RESTRAINED_LIME

    future = [
        ("AI Waste Image Classification", "Train a computer vision model (TensorFlow.js / Gemini Vision) to automatically classify garbage type (plastic, organic, toxic) and recommend priority."),
        ("IoT Smart Bin Telemetry", "Deploy ultrasonic fill-level sensors on municipal bins to auto-generate collection assignments when fill capacity reaches 80%."),
        ("Automated Route Optimization", "Apply Dijkstra / TSP routing algorithms to calculate optimal fuel-efficient routes for collection trucks across assigned hotspot clusters."),
        ("Civic SMS / IVR Telephony", "Provide telephone-based reporting and automated SMS notifications to ensure rural and non-smartphone users are included in the loop.")
    ]

    for idx, (title, desc) in enumerate(future):
        y = 2.2 + (idx * 1.05)
        tb = slide9.shapes.add_textbox(Inches(7.1), Inches(y), Inches(5.1), Inches(0.95))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = f"★  {title}"
        p1.font.name = "Calibri"
        p1.font.size = Pt(11.5)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_WHITE
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = "Calibri"
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_SOFT_SAGE

    # =========================================================================
    # SLIDE 10: Conclusion & Production Readiness
    # =========================================================================
    slide10 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide10)
    add_header(slide10, "09. Project Summary", "Conclusion & Production Architecture", 10)
    add_footer(slide10)

    # 3 Summary Cards
    cards10 = [
        ("Civic & Social Value", [
            ("Closed-Loop Accountability", "Eliminates ghost closures through mandatory supervisory photo audit."),
            ("Civic Participation", "Empowers citizens to actively engage in neighborhood cleanliness via Green Points."),
            ("Sanitation Dignity", "Equips collectors with transparent digital task queues and performance metrics.")
        ]),
        ("Technical Robustness", [
            ("383 Automated Tests", "Comprehensive test suites verified 100% PASS with 0 regressions."),
            ("Scalable Cloud Design", "Modular micro-architecture ready to onboard multiple municipal wards."),
            ("Enterprise Security", "Strict JWT auth, salted hashes, CORS guards, and sanitized inputs.")
        ]),
        ("Production Deployment", [
            ("Frontend (Vercel)", "Edge CDN with SPA catch-all rewrites at cleanloop.vercel.app."),
            ("Backend (Render)", "Express Node service with reverse proxy at cleanloop-api.onrender.com."),
            ("Database & Media", "MongoDB Atlas cloud cluster + Cloudinary CDN media pipeline.")
        ])
    ]

    for idx, (col_title, col_items) in enumerate(cards10):
        x = 0.8 + (idx * 3.95)
        add_card(slide10, x, 1.5, 3.8, 3.2, COLOR_WHITE, COLOR_MUTED_STONE, 1.2)

        tb_title = slide10.shapes.add_textbox(Inches(x + 0.2), Inches(1.65), Inches(3.4), Inches(0.4))
        tb_title.text_frame.paragraphs[0].text = col_title.upper()
        tb_title.text_frame.paragraphs[0].font.name = "Calibri"
        tb_title.text_frame.paragraphs[0].font.size = Pt(12)
        tb_title.text_frame.paragraphs[0].font.bold = True
        tb_title.text_frame.paragraphs[0].font.color.rgb = COLOR_DEEP_SLATE

        for j, (it_title, it_desc) in enumerate(col_items):
            yj = 2.15 + (j * 0.78)
            tb = slide10.shapes.add_textbox(Inches(x + 0.2), Inches(yj), Inches(3.4), Inches(0.72))
            tf = tb.text_frame
            tf.word_wrap = True
            tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
            p1 = tf.paragraphs[0]
            p1.text = f"• {it_title}"
            p1.font.name = "Calibri"
            p1.font.size = Pt(10.5)
            p1.font.bold = True
            p1.font.color.rgb = COLOR_TEXT_MAIN

            p2 = tf.add_paragraph()
            p2.text = it_desc
            p2.font.name = "Calibri"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = COLOR_TEXT_MUTED

    # Bottom "Thank You" & Contact Card
    thank_card = add_card(slide10, 0.8, 4.9, 11.733, 1.9, COLOR_FOREST_DARK, None)

    th_box = slide10.shapes.add_textbox(Inches(1.2), Inches(5.05), Inches(11.0), Inches(1.6))
    tf_th = th_box.text_frame
    tf_th.word_wrap = True

    p_t1 = tf_th.paragraphs[0]
    p_t1.text = "Thank You!"
    p_t1.font.name = "Georgia"
    p_t1.font.size = Pt(26)
    p_t1.font.bold = True
    p_t1.font.color.rgb = COLOR_RESTRAINED_LIME
    p_t1.alignment = PP_ALIGN.CENTER

    p_t2 = tf_th.add_paragraph()
    p_t2.text = "Questions & Demonstration Discussion"
    p_t2.font.name = "Calibri"
    p_t2.font.size = Pt(14)
    p_t2.font.color.rgb = COLOR_WHITE
    p_t2.alignment = PP_ALIGN.CENTER

    p_t3 = tf_th.add_paragraph()
    p_t3.text = "Project Team: Bhuthukuri Sunitha (241FA04492)  |  Babul Kumar (241FA04534)  |  Ayush Kumar (241FA04552)\nRepository: https://github.com/Babul534/CleanLoop.git"
    p_t3.font.name = "Calibri"
    p_t3.font.size = Pt(11)
    p_t3.font.color.rgb = COLOR_SOFT_SAGE
    p_t3.alignment = PP_ALIGN.CENTER

    # -------------------------------------------------------------------------
    # Save Presentation
    # -------------------------------------------------------------------------
    output_path = os.path.join("presentation", "CleanLoop_Project_Presentation.pptx")
    prs.save(output_path)
    print(f"[SUCCESS] Presentation generated successfully: {output_path}")

if __name__ == "__main__":
    create_presentation()

