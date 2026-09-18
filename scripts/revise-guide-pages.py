from pathlib import Path
import io, fitz
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
ROOT=Path(__file__).resolve().parents[1]
PDF=ROOT/'public/lead-magnet/before-you-quote.pdf'
for name,file in [('Body','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf'),('Heading','DejaVuSans-Bold.ttf')]:
 pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold')
PAGES=[
('03 / THE PRICE CONVERSATION','Your next level won’t happen in a price argument.',[
'You know the conversation.',
'“How much?”<br/>You give a number.<br/>They ask for less.',
'Now you’re defending years of practice to someone who hasn’t asked a single question about your work.',
'An Instagram message can be the first introduction. But when your whole booking experience stays in that thread, it’s easy for the conversation to become a comparison of prices.',
'The client sees a number. You see the drawing, the planning, the execution—and everything it took to become capable of doing it.',
'Haggling won’t close that gap.',
'The clients who invest in substantial custom work need reasons to feel confident choosing you. Your portfolio matters. So does the experience of dealing with you. A scattered exchange of prices and concessions does little to establish that confidence.',
'<b>If you want clients to treat your work as a serious investment, your booking experience needs to reflect that.</b>',
'That was one of the biggest changes in my own career: moving client intake out of DMs and giving it a system.',
'If you want to see some examples of what has worked for me, The Booked Artist System was built to help you make that shift in your own business.'
]),
('04 / THE RIGHT FIT','You can’t negotiate someone into being the right client.',[
'Someone can love tattoos and still be the wrong fit for your work.',
'They might want a different style. Have different priorities. Need a price you can’t sustainably offer. None of that changes because you spend another evening trying to convince them.',
'But when you need the booking, it’s hard to let go.',
'You explain more. Offer more. Cut the price. Start imagining a version of the project that makes everybody happy, except you.',
'I know that feeling. I’ve taken work because the money was there, even when it pulled me away from the career I wanted.',
"<b>You CAN'T make someone value what you value.</b>",
'<b>You CAN decide how much of your time and energy you keep investing in that mismatch.</b>',
'A smaller tattoo can be a great booking. A large tattoo can be a terrible one. Fit depends on your work, your goals, and whether the project makes sense for both people.',
'The Booked Artist System gives that change in perspective something practical to anchor to. Something you can adapt to your own situation as you become more deliberate about the work you take on.',
'You don’t need every inquiry to become your client.',
'You need your bookings to move you toward the career you’re trying to build.'
]),
('05 / YOUR NEXT CHAPTER','Give the career you want a place in the decisions you make today.',[
'Maybe your calendar has too many gaps.',
'Maybe it’s full of $200 and $300 tattoos while the larger pieces you want to create stay in your sketchbook.',
'Either way, you can feel the distance between what you’re capable of and what tattooing is giving you back.',
'I spent years improving my drawings and designs. But the biggest level up in my career came when I changed how I handled client intake and where I put my time and energy.',
'It felt crazy to turn down a tattoo when I could use the money. It took time to stop stepping over dollars to pick up dimes.',
'I also know what it feels like to be sought out for my work, make thousands in a day, and have happy clients give me more than I asked.',
'I don’t know if I’d still have a tattoo career, much less a successful one, without making this shift.',
'<b>The Booked Artist System is the practical support I built around it.</b>',
'Its templates and guides give you guardrails you can customize around your work, your clients, and your goals. You bring the artistic ability and the ambition. The system helps you put intention behind the business they’re building.',
'<b>Start with the Working System — $47</b>',
'My recommended edition for most artists ready to build toward better bookings and more rewarding work.',
'<b><link href="https://tatassist.com/lp/booked-artist?edition=working" color="#e94236">GET THE BOOKED ARTIST SYSTEM →</link></b>',
'One payment. 30-day satisfaction guarantee.',
'— <b>Joker Ink</b><br/>18 years tattooing · Studio owner<br/><link href="https://www.instagram.com/jokerinkx3/" color="#e94236">@jokerinkx3</link>'
])]
buf=io.BytesIO();c=canvas.Canvas(buf,pagesize=(768,1024))
for idx,(label,title,paras) in enumerate(PAGES,4):
 c.setFillColor(HexColor('#f1ece3'));c.rect(0,0,768,1024,fill=1,stroke=0)
 c.setFillColor(HexColor('#151515'));c.setFont('Bold',9);c.drawString(54,984,'TATASSIST / ARTIST SYSTEMS')
 c.setFillColor(HexColor('#e94236'));c.drawRightString(714,984,label)
 heading=Paragraph(title,ParagraphStyle('Heading',fontName='Heading',fontSize=31,leading=36,textColor=HexColor('#151515')))
 _,hh=heading.wrap(660,900);heading.drawOn(c,54,928-hh)
 top=928-hh-24
 size=16;gap=14
 while True:
  style=ParagraphStyle('Body',fontName='Body',fontSize=size,leading=size*1.45,textColor=HexColor('#272522'))
  rendered=[Paragraph(p,style) for p in paras];heights=[p.wrap(660,900)[1] for p in rendered]
  if sum(heights)+gap*(len(paras)-1)<=top-70:break
  size-=.25;gap=max(8,gap-.5)
  assert size>=11.5,'Copy does not fit'
 y=top
 for p,h in zip(rendered,heights):p.drawOn(c,54,y-h);y-=h+gap
 c.setFillColor(HexColor('#77736c'));c.setFont('Body',8);c.drawString(54,28,'BEFORE YOU QUOTE');c.drawCentredString(384,28,'JOKER INK / TATASSIST');c.drawRightString(714,28,f'{idx:02}')
 c.showPage();print('Page',idx,'font',size,'bottom',round(y))
c.save();replacement=fitz.open(stream=buf.getvalue(),filetype='pdf');old=fitz.open(PDF);out=fitz.open()
out.insert_pdf(old,from_page=0,to_page=2);out.insert_pdf(replacement);out.insert_pdf(old,from_page=6)
out.set_metadata({'title':'Before You Quote','author':'Joker Ink / Tatassist','subject':'Artist mindset and The Booked Artist System'})
old.close();out.save(PDF.with_suffix('.new.pdf'),garbage=4,deflate=True);out.close();PDF.with_suffix('.new.pdf').replace(PDF)
