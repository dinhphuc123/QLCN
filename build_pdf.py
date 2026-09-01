import os
import subprocess
import markdown

md_path = "/home/phuc/.gemini/antigravity/brain/98de282f-db43-419b-8892-476048b110f8/user_guide_qlcn.md"
html_path = "/home/phuc/.gemini/antigravity/brain/98de282f-db43-419b-8892-476048b110f8/user_guide_qlcn.html"
pdf_path = "/home/phuc/.gemini/antigravity/brain/98de282f-db43-419b-8892-476048b110f8/user_guide_qlcn.pdf"

with open(md_path, "r", encoding="utf-8") as f:
    md_content = f.read()

# Convert markdown to html with tables, fences, codeblocks
html_body = markdown.markdown(md_content, extensions=['tables', 'fenced_code', 'toc', 'nl2br'])

full_html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Huong dan su dung So Chu Nhiem So 12.7</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
    
    @page {{
      size: A4 portrait;
      margin: 18mm 15mm 18mm 15mm;
    }}
    
    body {{
      font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 13px;
      background: white;
    }}

    /* Cover / Banner */
    h1 {{
      font-size: 22px;
      color: #1b4d53;
      border-bottom: 3px solid #729b12;
      padding-bottom: 8px;
      margin-top: 0;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}

    h2 {{
      font-size: 16px;
      color: #1b4d53;
      background: #f4f8d0;
      padding: 6px 12px;
      border-left: 5px solid #729b12;
      border-radius: 4px;
      margin-top: 22px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }}

    h3 {{
      font-size: 14px;
      color: #0f766e;
      margin-top: 16px;
      margin-bottom: 8px;
      font-weight: 700;
      page-break-after: avoid;
    }}

    p {{
      margin: 8px 0;
      text-align: justify;
    }}

    /* Blockquote / Alert Boxes */
    blockquote {{
      background: #f8fafc;
      border-left: 4px solid #0284c7;
      margin: 12px 0;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      font-size: 12.5px;
      color: #334155;
    }}

    blockquote p {{
      margin: 0;
    }}

    /* Tables */
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 12px;
      page-break-inside: avoid;
    }}

    th {{
      background: #1b4d53;
      color: white;
      text-align: left;
      padding: 8px 10px;
      font-weight: 700;
      border: 1px solid #1b4d53;
    }}

    td {{
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }}

    tr:nth-child(even) td {{
      background: #f8fafc;
    }}

    /* Code blocks / pre */
    pre, code {{
      font-family: 'Consolas', 'Courier New', monospace;
      background: #f1f5f9;
      color: #0f172a;
      border-radius: 4px;
    }}

    pre {{
      padding: 10px 12px;
      overflow-x: auto;
      border: 1px solid #cbd5e1;
      font-size: 11.5px;
      line-height: 1.45;
      page-break-inside: avoid;
    }}

    code {{
      padding: 2px 5px;
      font-size: 11.5px;
    }}

    /* Lists */
    ul, ol {{
      padding-left: 20px;
      margin: 8px 0;
    }}

    li {{
      margin-bottom: 4px;
    }}

    /* Links */
    a {{
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
    }}

    /* Badges */
    strong {{
      color: #0f172a;
    }}

    hr {{
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 20px 0;
    }}

    .page-break {{
      page-break-before: always;
    }}
  </style>
</head>
<body>
  {html_body}
</body>
</html>
"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(full_html)

print("HTML generated successfully at:", html_path)

# Run Chrome headless to render PDF
cmd = [
    "/usr/bin/google-chrome",
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    f"--print-to-pdf={pdf_path}",
    html_path
]

res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode == 0:
    print("PDF generated successfully at:", pdf_path)
else:
    print("PDF build error:", res.stderr)
