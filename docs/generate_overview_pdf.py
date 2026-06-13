# -*- coding: utf-8 -*-
"""يولّد Lumiere-Orders-Overview.pdf — شرح النظام والمشكلة اللي بيحلها.
تشغيل: python docs/generate_overview_pdf.py (من جذر المشروع)

ملاحظات عربي/PDF:
- Tahoma: تغطية كاملة لأشكال العرض العربية (Cairo ناقصها الهمزات وغيرها).
- الـ bidi بيتطبق سطر-سطر بعد لف يدوي — تطبيقه على الفقرة كلها بيعكس ترتيب السطور.
"""
import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

# ===== هوية لوميير (v3 Soft Premium) =====
INK = HexColor("#0F0F0F")
INK_500 = HexColor("#6F6A62")
INK_300 = HexColor("#A8A299")
SOFT_WHITE = HexColor("#FBFAF7")
CREAM = HexColor("#F6EFE4")
BEIGE = HexColor("#EDE2D2")
PASTEL = [HexColor(c) for c in ("#FADADD", "#FFCBA4", "#FFF4C8", "#D4F1E0", "#CCE3F4", "#E6D8F3")]
MINT = HexColor("#D4F1E0")
PINK = HexColor("#FADADD")

pdfmetrics.registerFont(TTFont("Body", r"C:\Windows\Fonts\tahoma.ttf"))
pdfmetrics.registerFont(TTFont("Bold", r"C:\Windows\Fonts\tahomabd.ttf"))


def rtl_lines(text: str, font: str, size: float, avail_pt: float) -> str:
    """لف يدوي: تشكيل كلمة-كلمة، رص بالعرض المتاح، ثم bidi لكل سطر —
    فيطلع ترتيب السطور صحيح والكلمات اللاتينية في مكانها."""
    words = [arabic_reshaper.reshape(w) for w in text.split()]
    space_w = pdfmetrics.stringWidth(" ", font, size)
    lines, current, width = [], [], 0.0
    for w in words:
        ww = pdfmetrics.stringWidth(w, font, size)
        add = ww if not current else ww + space_w
        if current and width + add > avail_pt:
            lines.append(" ".join(current))
            current, width = [w], ww
        else:
            current.append(w)
            width += add
    if current:
        lines.append(" ".join(current))
    return "<br/>".join(get_display(line) for line in lines)


def P(text: str, style: ParagraphStyle, avail_mm: float) -> Paragraph:
    return Paragraph(rtl_lines(text, style.fontName, style.fontSize, avail_mm * mm), style)


def line(text: str) -> str:
    """سطر واحد جاهز (للرسم المباشر على الكانفاس)"""
    return get_display(arabic_reshaper.reshape(text))


# ===== الأنماط =====
H1 = ParagraphStyle("H1", fontName="Bold", fontSize=19, leading=28,
                    alignment=TA_RIGHT, textColor=INK, spaceAfter=2)
H2 = ParagraphStyle("H2", fontName="Bold", fontSize=13.5, leading=22,
                    alignment=TA_RIGHT, textColor=INK, spaceBefore=10, spaceAfter=4)
BODY = ParagraphStyle("Body", fontName="Body", fontSize=10, leading=18,
                      alignment=TA_RIGHT, textColor=INK)
BODY_BOLD = ParagraphStyle("BodyBold", parent=BODY, fontName="Bold")
MUTED = ParagraphStyle("Muted", fontName="Body", fontSize=9.5, leading=16,
                       alignment=TA_RIGHT, textColor=INK_500)
WORDMARK = ParagraphStyle("Wordmark", fontName="Bold", fontSize=25, leading=30,
                          alignment=TA_RIGHT, textColor=INK)
NUM = ParagraphStyle("Num", fontName="Bold", fontSize=11, alignment=TA_CENTER,
                     textColor=INK, leading=18)
LINK = ParagraphStyle("Link", fontName="Bold", fontSize=10, alignment=TA_CENTER, textColor=INK)

CONTENT_MM = 174  # عرض المحتوى داخل الهوامش


def bullets(items, chip_color):
    rows = [[P(it, BODY, 148), ""] for it in items]
    t = Table(rows, colWidths=[156 * mm, 5 * mm])
    style = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (0, -1), 5),
    ]
    for i in range(len(rows)):
        style += [
            ("BACKGROUND", (1, i), (1, i), chip_color),
            ("LINEABOVE", (1, i), (1, i), 6, SOFT_WHITE),
            ("LINEBELOW", (1, i), (1, i), 6, SOFT_WHITE),
        ]
    t.setStyle(TableStyle(style))
    return t


def panel(flowables, bg=CREAM):
    t = Table([[flowables]], colWidths=[CONTENT_MM * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    return t


def step_row(num, title, body, color):
    t = Table(
        [[P(body, BODY, 112), P(title, BODY_BOLD, 36), Paragraph(str(num), NUM)]],
        colWidths=[118 * mm, 40 * mm, 10 * mm],
    )
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, BEIGE),
        ("BACKGROUND", (2, 0), (2, 0), color),
    ]))
    return t


def on_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(SOFT_WHITE)
    canvas.rect(0, 0, w, h, stroke=0, fill=1)
    seg = w / len(PASTEL)
    for i, c in enumerate(PASTEL):
        canvas.setFillColor(c)
        canvas.rect(i * seg, h - 4 * mm, seg + 1, 4 * mm, stroke=0, fill=1)
    canvas.setFont("Body", 8)
    canvas.setFillColor(INK_300)
    canvas.drawCentredString(w / 2, 8 * mm, line("Lumière Orders — وثيقة تعريفية · 2026"))
    canvas.drawRightString(w - 14 * mm, 8 * mm, str(canvas.getPageNumber()))
    canvas.restoreState()


doc = BaseDocTemplate(
    "docs/Lumiere-Orders-Overview.pdf", pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=18 * mm,
    title="Lumiere Orders — Overview", author="Lumiere Beauty",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([PageTemplate(id="page", frames=[frame], onPage=on_page)])

story = []

# ===== الهيدر =====
story.append(Paragraph("LUMIÈRE", WORDMARK))
story.append(P("Lumière Orders — مركز الأوردرات والشحن", H1, CONTENT_MM))
story.append(P("نظام داخلي لإدارة أوردرات عطور لوميير من لحظة وصول الطلب لحد تسليمه للعميل.", MUTED, CONTENT_MM))
story.append(Spacer(1, 8))

# ===== المشكلة =====
story.append(P("المشكلة اللي بيحلها", H2, CONTENT_MM))
story.append(P(
    "قبل النظام، تجهيز شحنات لوميير كان شغل يدوي مشتت بين أكتر من مكان، وكل خطوة فيه فرصة لخطأ بيكلف وقت أو فلوس:",
    BODY, CONTENT_MM))
story.append(Spacer(1, 4))
story.append(bullets([
    "الأوردرات بتيجي من ٣ مصادر منفصلة — متجر سلر، واتساب، إنستجرام — من غير مكان واحد يجمعها.",
    "ملف شركة الشحن «وصلها» له صيغة صارمة: أسماء محافظات معينة، أرقام تليفون بصيغة محلية، وزن ثابت، وحقول لازم تفضل فاضية. التحويل اليدوي كان بيترفض أو بيتأخر بسبب أخطاء الصيغة.",
    "مسح قائمة اليوم عشان دفعة جديدة كان معناه ضياع الهيستوري بالكامل — ولو حصل قبل التصدير بالغلط، الدفعة كلها بتضيع.",
    "مفيش تتبع لحالة الشحنة بعد خروجها: اتشحنت؟ وصلت؟ مرتجعة؟ ولا متابعة للمرتجعات في تسوية الـ COD.",
    "الستوك مكنش متتبع: البيع من غير معرفة المتاح، وتحديث كميات متجر سلر شغل يدوي منفصل.",
    "مع دخول فريق للشغل: مفيش حسابات ولا صلاحيات ولا طريقة تعرف مين عمل إيه.",
], PINK))
story.append(Spacer(1, 6))

# ===== الحل =====
story.append(P("الحل", H2, CONTENT_MM))
story.append(panel([P(
    "نظام ويب واحد بهوية لوميير، بالعربي والإنجليزي، شغال من المتصفح على أي جهاز. "
    "بيجمع الطلبات كلها في مكان واحد، بيحولها لصيغة وصلها تلقائياً بصفر أخطاء، "
    "بيحافظ على هيستوري دائم بحالة لكل شحنة، بيدير الستوك والكتالوج بنفس ملف متجر سلر، "
    "وبيسجل كل عملية باسم صاحبها.", BODY, 146)]))
story.append(Spacer(1, 6))

# ===== الفلو =====
story.append(P("دورة الشغل اليومية", H2, CONTENT_MM))
for row in [
    (1, "اجمع الأوردرات",
     "ملف سلر بيترفع وبيتحول تلقائياً — محافظات وتليفونات وعناوين — وأوردرات الواتساب والإنستجرام بتتسجل من فورم سريع بيختار المنتجات من الكتالوج، والسعر بيتجمع في الـ COD لوحده.",
     PASTEL[3]),
    (2, "راجع وعدّل",
     "أي أوردر محافظته مش متعرفة بيتعلم بعلامة تحذير، وكل أوردر قابل للعرض الكامل والتعديل قبل الشحن.",
     PASTEL[4]),
    (3, "انقل للشحنات",
     "زرار واحد بينقل الدفعة بأمان لصفحة الشحنات ويفضي القائمة لليوم الجديد — مفيش حاجة بتتمسح.",
     PASTEL[5]),
    (4, "صدّر ملف وصلها",
     "ملف إكسل جاهز بصيغة وصلها الرسمية بضغطة — الكل أو المحدد بس، والوزن والحقول الثابتة بتتظبط تلقائياً.",
     PASTEL[2]),
    (5, "تابع لحد التسليم",
     "حالة لكل شحنة: تحت التجهيز ← تم الشحن ← وصل للعميل / مرتجع / ملغي — والهيستوري محفوظ دايماً.",
     PASTEL[0]),
]:
    story.append(step_row(*row))
story.append(Spacer(1, 6))

# ===== الإمكانيات =====
story.append(P("أهم الإمكانيات", H2, CONTENT_MM))
story.append(bullets([
    "كتالوج منتجات كامل: كل عطر بأحجامه وسعر وكمية ستوك لكل حجم — واستيراد وتصدير بنفس ملف متجر سلر بالظبط، فتحديث المتجر بقى تصدير ملف جاهز.",
    "ستوك ذكي: بيتخصم تلقائياً مع كل أوردر — حتى المستورد من سلر، بيتعرف على المنتج بالكود وبالاسم العربي — وبيرجع لو الأوردر اتلغى قبل الشحن، والنافد بيظهر بالأحمر.",
    "مستخدمين وصلاحيات: أدمن بيدير كل حاجة، وموظف للأوردرات بس، مع تفعيل وتعطيل فوري — وكل مستخدم بيغير الباسورد بتاعه بنفسه.",
    "سجل نشاط غير قابل للتعديل: كل عملية متسجلة باسم صاحبها ووقتها — حتى الأدمن مش بيقدر يمسح أو يعدل فيه.",
    "واجهة عربي/إنجليزي كاملة، متجاوبة مع الموبايل، بهوية لوميير البصرية.",
], MINT))
story.append(Spacer(1, 6))

# ===== التقنية =====
story.append(P("تحت الغطاء", H2, CONTENT_MM))
story.append(panel([
    P("مبني بـ Next.js وFirebase — مصادقة وقاعدة بيانات لحظية — ومنشور مجاناً على GitHub Pages "
      "من غير سيرفر يتدار أو تكلفة استضافة. الأمان مفروض بقواعد Firestore على مستوى قاعدة البيانات نفسها، "
      "والنشر تلقائي بالكامل: أي تحديث بيعدي على فحص آلي قبل ما يوصل للإنتاج.", BODY, 146),
    Spacer(1, 4),
    Paragraph("https://yousefessawy.github.io/lumiere-orders/", LINK),
]))

doc.build(story)
print("OK: docs/Lumiere-Orders-Overview.pdf")
