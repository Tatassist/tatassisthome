"""Rebuild all seven pages with approved copy and a unified editorial layout."""
from pathlib import Path
import ast,re
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
R=Path(__file__).resolve().parents[1]
for name,file in [('Body','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf')]:pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold')
tree=ast.parse((R/'scripts/revise-guide-pages.py').read_text());approved=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='PAGES' for t in n.targets))
C=canvas.Canvas(str(R/'public/lead-magnet/before-you-quote.pdf'),pagesize=(768,1024));C.setTitle('Before You Quote');C.setAuthor('Joker Ink / Tatassist')
cream='#f1ece3';ink='#111111';red='#ed4437';muted='#57524b';width=660

def para(t,x,y,w=width,size=16,bold=False,color=ink):
 p=Paragraph(t,ParagraphStyle('p',fontName='Bold' if bold else 'Body',fontSize=size,leading=size*1.4,textColor=HexColor(color)))
 _,h=p.wrap(w,2000);p.drawOn(C,x,y-h);return y-h

def base(n):
 C.setFillColor(HexColor(cream));C.rect(0,0,768,1024,fill=1,stroke=0)
 C.setFillColor(HexColor(ink));C.rect(0,954,768,70,fill=1,stroke=0)
 C.setFont('Bold',10);C.setFillColor(HexColor(cream));C.drawString(54,981,'TATASSIST / ARTIST SYSTEMS')
 C.setFillColor(HexColor(red));C.rect(54,938,62,4,fill=1,stroke=0)
 C.setStrokeColor(HexColor('#cfc8bd'));C.line(54,51,714,51)
 C.setFont('Body',9);C.setFillColor(HexColor(muted));C.drawString(54,30,'BEFORE YOU QUOTE');C.drawCentredString(384,30,'JOKER INK / TATASSIST');C.drawRightString(714,30,f'{n:02} / 07')

def title(t):return para(t,54,908,size=33,bold=True)-25

def panel(t,y,size=17):
 p=Paragraph(t,ParagraphStyle('box',fontName='Bold',fontSize=size,leading=size*1.4,textColor=HexColor(cream)))
 _,h=p.wrap(620,2000);C.setFillColor(HexColor(ink));C.rect(54,y-h-34,660,h+34,fill=1,stroke=0);C.setFillColor(HexColor(red));C.rect(54,y-h-34,5,h+34,fill=1,stroke=0);p.drawOn(C,74,y-h-17);return y-h-52

base(1)
para('FREE GUIDE / FOR WORKING TATTOO ARTISTS',54,889,size=12,bold=True,color=muted)
para('BEFORE',50,810,size=79,bold=True)
para('YOU QUOTE',50,704,size=79,bold=True,color=red)
para('Why good tattoo inquiries go quiet after the price - and what to change before your next quote.',54,530,w=630,size=23)
C.setFillColor(HexColor(ink));C.rect(54,170,660,153,fill=1,stroke=0)
para('THE QUOTE IS ONE MOMENT.',78,295,size=24,bold=True,color=cream)
para('The client experience starts before it.',78,245,size=20,color=cream)
C.showPage()
base(2);y=title('THE QUOTE IS NOT<br/>ALWAYS THE PROBLEM.')
for t in ['Some clients simply cannot afford the project, are not ready, or are not a fit. That is normal.','But sometimes a suitable client disappears because the conversation reached price before the project - or the next decision - was clear.']:y=para(t,54,y)-20
for label,items in [('WHAT YOU SEE',['They liked my work.','They seemed serious.','I sent the number.','Then they went quiet.']),('WHAT MAY BE MISSING',['A defined tattoo project','Enough context to estimate','A specific next decision','A follow-up path if timing changes'])]:
 y=para(label,54,y,size=14,bold=True,color=red)-12
 y=para(' &nbsp; • &nbsp; '.join(items),54,y,size=16)-26
# Same approved words, styled as a pull quote rather than a process diagram.
y=panel('BEFORE YOU LOWER YOUR PRICE, CHECK:<br/>WHAT HAPPENED BEFORE YOU SENT IT?',y)
y=para('If the project was clear, the estimate was appropriate, and the next step was obvious, the answer may simply be no. The goal is clarity - not forcing every inquiry into a booking.',54,y,size=15)
assert y>65;C.showPage()
base(3);y=title('STOP ASKING')
y=para('&quot;WILL THIS PERSON CHOOSE ME?&quot;',54,y,size=36,bold=True)-36
y=para('START ASKING',54,y,size=15,bold=True,color=red)-18
y=panel('&quot;ARE WE A GOOD FIT FOR EACH OTHER AND FOR THIS PROJECT?&quot;',y,size=30)
y=para('That changes what you do next.',54,y,size=20,bold=True)-22
for t in ['You gather the information needed to understand the tattoo.','You do not spend the same time on every inquiry.','You present the estimate as part of a defined project.','You know what happens if the answer is yes, not now, or no.']:y=para(t,54,y)-20
assert y>65;C.showPage()
for n,(_,heading,body) in enumerate(approved,4):
 base(n);top=title(heading)
 # Emphasize only existing approved text. No added copy or illustrations.
 size=16;gap=15
 def height(t):
  p=Paragraph(t,ParagraphStyle('m',fontName='Body',fontSize=size,leading=size*1.4));return p.wrap(660,2000)[1]
 while sum(height(t)+(34 if t.startswith('<b>') and 'link' not in t and 'Start with' not in t else 0) for t in body)+gap*len(body)>top-76:
  size-=.25;gap=max(9,gap-.5)
  assert size>=13
 y=top
 for t in body:
  highlighted=t.startswith('<b>') and 'link' not in t and 'Start with' not in t
  if highlighted:
   h=height(t);C.setFillColor(HexColor('#e6dfd3'));C.rect(44,y-h-22,680,h+28,fill=1,stroke=0);C.setFillColor(HexColor(red));C.rect(44,y-h-22,4,h+28,fill=1,stroke=0);y=para(t,54,y-8,size=size)-26
  else:y=para(t,54,y,size=size)-gap
 assert y>55,(n,y);print('Page',n,'font',size,'bottom',round(y));C.showPage()
base(7);y=para('THE BOOKED ARTIST SYSTEM / BY JOKER INK',54,905,size=12,bold=True,color=red)-28
y=para('STOP LETTING GOOD PROJECTS DIE IN YOUR DMs.',54,y,size=35,bold=True)-24
y=para('The sleeve that went quiet. The project buried in messages. Put a process behind the inquiries you’re already getting.',54,y,size=19)-35
y=para('RECOMMENDED',54,y,size=13,bold=True,color=red)-10
y=para('Working System / $47',54,y,size=34,bold=True)-24
for t in ['<b>13 numbered tools + guides.</b> Handle inquiries, changing project details, client pauses, and deposit confirmation with a process you can actually follow.','Original PNGs, numbered PDFs, a combined workbook, and setup guides. The order is already on the pages.']:y=para(t,54,y)-18
y=panel('<link href="https://tatassist.com/lp/booked-artist?edition=working" color="#ffffff">GET WORKING SYSTEM / $47</link>',y,size=20)
y=para('One payment. Individual artist license. 30-day satisfaction guarantee.',54,y,size=13)-24
y=para('Other editions: Essentials / 6 tools / $27. Complete System / 22 tools / $77. Each higher edition includes everything below it.',54,y,size=13)-24
y=para('<link href="https://www.instagram.com/jokerinkx3/" color="#ed4437">@jokerinkx3</link> | <link href="https://tatassist.com/lp/booked-artist" color="#ed4437">tatassist.com/lp/booked-artist</link>',54,y,size=13)
assert y>65;C.showPage();C.save()
