"""
Validation script for CleanLoop PowerPoint Presentation.
Verifies structure, slide count, content integrity, and image embeds.
"""

import os
from pptx import Presentation

def validate_presentation():
    pptx_path = os.path.join("presentation", "CleanLoop_Project_Presentation.pptx")
    assert os.path.exists(pptx_path), f"File not found: {pptx_path}"
    
    file_size_kb = os.path.getsize(pptx_path) / 1024
    print(f"[CHECK] File exists: {pptx_path} ({file_size_kb:.2f} KB)")
    assert file_size_kb > 50, "File size appears too small for embedded presentation"

    prs = Presentation(pptx_path)
    slide_count = len(prs.slides)
    print(f"[CHECK] Total slides: {slide_count}")
    assert slide_count == 10, f"Expected exactly 10 slides, found {slide_count}"

    expected_titles = [
        "CleanLoop",
        "Urban Waste Bottlenecks",
        "Project Objectives",
        "Modern Full-Stack MERN",
        "Multi-Tier Infrastructure",
        "Core Modules & Role-Based",
        "Mongoose Document Schemas",
        "Live Application Screenshots",
        "Key Challenges Overcome",
        "Conclusion & Production Architecture"
    ]

    expected_team = [
        "Bhuthukuri Sunitha", "241FA04492",
        "Babul Kumar", "241FA04534",
        "Ayush Kumar", "241FA04552"
    ]

    all_text = []
    image_count = 0

    for idx, slide in enumerate(prs.slides, 1):
        slide_text = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    if paragraph.text.strip():
                        slide_text.append(paragraph.text.strip())
            if shape.shape_type == 13: # Picture
                image_count += 1
        
        full_slide_text = " ".join(slide_text)
        all_text.append(full_slide_text)
        print(f"  Slide {idx:02d}: {len(slide.shapes)} shapes | {len(slide_text)} text fragments | Pictures: {sum(1 for s in slide.shapes if s.shape_type == 13)}")

        # Verify title match
        assert any(expected_titles[idx - 1].lower() in t.lower() for t in slide_text), f"Slide {idx} title mismatch"

    combined_text = " ".join(all_text)
    
    # Verify team members
    for item in expected_team:
        assert item in combined_text, f"Missing team detail: {item}"
        print(f"[PASS] Found required team detail: {item}")

    # Verify images
    print(f"[CHECK] Total embedded images: {image_count}")
    assert image_count >= 3, f"Expected at least 3 embedded screenshot images, found {image_count}"

    # Verify no leaked secrets
    forbidden = ["CLOUDINARY_API_SECRET", "JWT_SECRET=", "mongodb+srv://babul:", "password123"]
    for secret in forbidden:
        assert secret not in combined_text, f"Potential credential leak detected: {secret}"
    print("[PASS] Credential security check passed (zero leaks)")

    print("\n========================================================")
    print(" ALL PRESENTATION VALIDATION CHECKS PASSED (10 / 10)!")
    print("========================================================")

if __name__ == "__main__":
    validate_presentation()

