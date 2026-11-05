"""
Validation script for CleanLoop Explanation PDF.
Verifies file size, page count, chapter presence, team details, and security.
"""

import os
from pypdf import PdfReader

def validate_pdf():
    pdf_path = os.path.join("presentation", "documentation", "CleanLoop_Complete_Project_Guide.pdf")
    assert os.path.exists(pdf_path), f"File not found: {pdf_path}"

    file_size_kb = os.path.getsize(pdf_path) / 1024
    print(f"[CHECK] PDF File exists: {pdf_path} ({file_size_kb:.2f} KB)")
    assert file_size_kb > 100, "PDF size appears too small for comprehensive guide"

    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    print(f"[CHECK] Total page count: {total_pages} pages")
    assert 14 <= total_pages <= 22, f"Expected 14-22 pages, found {total_pages}"

    all_text = ""
    for idx, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ""
        all_text += f"\n--- PAGE {idx} ---\n" + text

    # Verify Chapters
    expected_chapters = [
        "Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4",
        "Chapter 5", "Chapter 6", "Chapter 7", "Chapter 8",
        "Chapter 9", "Chapter 10", "Chapter 11", "Chapter 12",
        "Chapter 13", "Chapter 14", "Chapter 15", "Chapter 16",
        "Chapter 17"
    ]

    for ch in expected_chapters:
        assert ch in all_text, f"Missing {ch} in generated PDF"
        print(f"[PASS] Verified presence of {ch}")

    # Verify Team Details
    team_members = [
        "Bhuthukuri Sunitha", "241FA04492",
        "Babul Kumar", "241FA04534",
        "Ayush Kumar", "241FA04552"
    ]
    for m in team_members:
        assert m in all_text, f"Missing team detail: {m}"
        print(f"[PASS] Verified team detail: {m}")

    # Verify Viva Questions
    for q_num in range(1, 46):
        assert f"Q{q_num}:" in all_text, f"Missing Viva Question Q{q_num}"
    print("[PASS] Verified all 45 Viva Questions & Answers (Q1 to Q45) present")

    # Verify Security (No credentials)
    forbidden = ["CLOUDINARY_API_SECRET", "JWT_SECRET=", "mongodb+srv://babul:"]
    for secret in forbidden:
        assert secret not in all_text, f"Credential leak detected: {secret}"
    print("[PASS] Security audit passed (zero credential leaks)")

    print("\n========================================================")
    print(f" ALL PDF VALIDATION CHECKS PASSED ({total_pages} PAGES)!")
    print("========================================================")

if __name__ == "__main__":
    validate_pdf()

