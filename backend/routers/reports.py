"""
CyberSphere Reports Router
──────────────────────────
Generates professional PDF security reports using reportlab.
"""

import io
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from database import get_connection
from routers.auth import get_current_user

# ReportLab imports
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

router = APIRouter()

@router.get("/summary")
def get_report_summary(current_user: dict = Depends(get_current_user)):
    """Returns metadata summary to show on the report dashboard before generating."""
    conn = get_connection()
    uid = current_user["sub"]

    total_scans = conn.execute("SELECT COUNT(*) FROM scans WHERE user_id = ?", (uid,)).fetchone()[0]
    total_files = conn.execute("SELECT COUNT(*) FROM files WHERE user_id = ?", (uid,)).fetchone()[0]
    dangerous_scans = conn.execute("SELECT COUNT(*) FROM scans WHERE user_id = ? AND risk_score > 60", (uid,)).fetchone()[0]

    # Calculate average security score
    avg_risk = conn.execute("SELECT AVG(risk_score) FROM scans WHERE user_id = ?", (uid,)).fetchone()[0]
    avg_risk = float(avg_risk) if avg_risk is not None else 0.0
    security_score = max(5, int(100 - avg_risk))

    conn.close()

    return {
        "totalScans": total_scans,
        "totalFiles": total_files,
        "dangerousScans": dangerous_scans,
        "securityScore": security_score,
        "generationTime": datetime.utcnow().isoformat()
    }

@router.get("/generate")
def generate_report(current_user: dict = Depends(get_current_user)):
    """Generates and streams a custom, designed PDF report containing the user's security log data."""
    conn = get_connection()
    uid = current_user["sub"]

    user = conn.execute("SELECT email, displayName FROM users WHERE id = ?", (uid,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User profile not found")

    scans = conn.execute(
        "SELECT scan_type, target, risk_score, timestamp FROM scans WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20",
        (uid,)
    ).fetchall()

    files = conn.execute(
        "SELECT filename, file_size, malware_status, created_at FROM files WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
        (uid,)
    ).fetchall()

    conn.close()

    # Create PDF in-memory buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    story = []
    styles = getSampleStyleSheet()

    # Define color scheme (cyber-inspired)
    primary_color = colors.HexColor("#0f172a") # Deep slate
    accent_color = colors.HexColor("#0ea5e9")  # Cyber cyan
    text_color = colors.HexColor("#334155")    # Slate text
    bg_dark = colors.HexColor("#1e293b")       # Header slate

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=accent_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=20
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=primary_color,
        spaceBefore=15,
        spaceAfter=8
    )

    normal_text = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        textColor=text_color,
        leading=14
    )

    header_cell_text = ParagraphStyle(
        'HeaderCellText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white
    )

    body_cell_text = ParagraphStyle(
        'BodyCellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        textColor=text_color
    )

    # 1. Branded Header
    story.append(Paragraph("CYBERSPHERE OPERATIONS CONTROL", title_style))
    story.append(Paragraph(f"SYSTEM AUDIT REPORT · GENERATED ON {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_color, spaceAfter=20))

    # 2. Executive Summary Block
    story.append(Paragraph("Executive Summary", section_heading))
    total_scans = len(scans)
    total_files = len(files)
    avg_risk = sum(r['risk_score'] for r in scans) / total_scans if total_scans > 0 else 0
    security_score = max(5, int(100 - avg_risk))
    status_label = "SECURE" if security_score >= 70 else ("AT RISK" if security_score >= 40 else "VULNERABLE")

    summary_text = (
        f"This security assessment summarizes the digital threat operations conducted under the account "
        f"<b>{user['displayName']} ({user['email']})</b>.<br/><br/>"
        f"Our threat engines have analyzed a total of <b>{total_scans} active scans</b> and registered "
        f"<b>{total_files} encrypted file packages</b>. Based on historic metrics, the platform "
        f"has evaluated your security posture score at <b>{security_score}/100</b>, classifying the operational status as "
        f"<b>{status_label}</b>."
    )
    story.append(Paragraph(summary_text, normal_text))
    story.append(Spacer(1, 15))

    # Stats Grid Table
    stats_data = [
        [
            Paragraph("<b>Total Scans</b>", normal_text),
            Paragraph("<b>Files Shared</b>", normal_text),
            Paragraph("<b>Posture Rating</b>", normal_text),
            Paragraph("<b>Security Score</b>", normal_text)
        ],
        [
            Paragraph(str(total_scans), normal_text),
            Paragraph(str(total_files), normal_text),
            Paragraph(status_label, normal_text),
            Paragraph(f"{security_score}%", normal_text)
        ]
    ]
    stats_table = Table(stats_data, colWidths=[130, 130, 130, 130])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    story.append(stats_table)
    story.append(Spacer(1, 20))

    # 3. Scan History Section
    story.append(Paragraph("Recent Scan History", section_heading))
    if total_scans == 0:
        story.append(Paragraph("No scan operations recorded.", normal_text))
    else:
        scan_table_data = [
            [
                Paragraph("Scan Type", header_cell_text),
                Paragraph("Target", header_cell_text),
                Paragraph("Risk Score", header_cell_text),
                Paragraph("Timestamp", header_cell_text)
            ]
        ]
        for s in scans:
            type_lbl = s['scan_type'].upper()
            target_lbl = s['target']
            if len(target_lbl) > 40:
                target_lbl = target_lbl[:37] + "..."
            
            risk = s['risk_score']
            risk_color = "#39ff14" if risk <= 25 else ("#ff9500" if risk <= 60 else "#ff0040")
            risk_html = f"<font color='{risk_color}'><b>{risk}</b></font>"

            scan_table_data.append([
                Paragraph(type_lbl, body_cell_text),
                Paragraph(target_lbl, body_cell_text),
                Paragraph(risk_html, body_cell_text),
                Paragraph(s['timestamp'][:19].replace("T", " "), body_cell_text)
            ])

        scan_table = Table(scan_table_data, colWidths=[90, 220, 80, 130])
        scan_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), bg_dark),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ]))
        story.append(scan_table)

    story.append(Spacer(1, 20))

    # 4. Secure Files Shared
    story.append(Paragraph("Secure Vault File Activities", section_heading))
    if total_files == 0:
        story.append(Paragraph("No vault files uploaded.", normal_text))
    else:
        file_table_data = [
            [
                Paragraph("Filename", header_cell_text),
                Paragraph("Size", header_cell_text),
                Paragraph("Malware Status", header_cell_text),
                Paragraph("Uploaded At", header_cell_text)
            ]
        ]
        for f in files:
            name_lbl = f['filename']
            if len(name_lbl) > 35:
                name_lbl = name_lbl[:32] + "..."
            
            size_mb = f['file_size'] / (1024 * 1024)
            size_lbl = f"{size_mb:.2f} MB" if size_mb >= 0.1 else f"{f['file_size']/1024:.1f} KB"

            status = f['malware_status'].upper()
            status_color = "#39ff14" if status == "CLEAN" else "#ff0040"
            status_html = f"<font color='{status_color}'><b>{status}</b></font>"

            file_table_data.append([
                Paragraph(name_lbl, body_cell_text),
                Paragraph(size_lbl, body_cell_text),
                Paragraph(status_html, body_cell_text),
                Paragraph(f['created_at'][:19].replace("T", " "), body_cell_text)
            ])

        file_table = Table(file_table_data, colWidths=[200, 90, 100, 130])
        file_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), bg_dark),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ]))
        story.append(file_table)

    story.append(Spacer(1, 30))

    # 5. Disclaimer / Footer Notice
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=15))
    disclaimer_text = (
        "<b>Notice:</b> This report is generated dynamically by the CyberSphere platform. "
        "All calculations and recommendations are based on scans and activities performed within the workspace database. "
        "Verify all system configs and configurations directly. Confidential document, for internal operational use only."
    )
    story.append(Paragraph(disclaimer_text, ParagraphStyle('Disclaimer', parent=normal_text, fontSize=7.5, textColor=colors.HexColor("#94a3b8"))))

    # Build document
    doc.build(story)

    # Return stream
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cybersphere-security-report-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.pdf"}
    )
