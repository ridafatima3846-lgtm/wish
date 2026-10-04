# Bubu & Dudu Birthday Surprise â¤ï¸ðŸŽ‚

A full-screen, no-scroll, interactive birthday story in **17 scenes** â€” romantic lines,
a typewriter love letter, a photo gallery of the birthday boy and a soft built-in melody.

## Run it
Open `index.html` (ya Live Server use karo). **START THE SURPRISE** dabao aur
**NEXT / BACK** se scenes badlo. Keyboard arrows aur touch swipe bhi chalte hain.
Music pehli click ke baad khud se shuru hota hai (browser autoplay rule).

## Scenes (17)
| # | Scene | Kya hai |
|---|-------|---------|
| 1 | Welcome | Opening line |
| 2 | Secret surprise | Chhota sa reveal |
| 3 | Special day | Aaj ka din tera hai |
| 4 | Happy Birthday | Main title + dua |
| 5 | Virtual hug | 3 lines + sticker |
| 6 | You mean so much | Glowing heart |
| 7 | You make me smile | Smile wall |
| 8 | Favorite person | 3 lines reveal |
| 9 | Always there | Support lines |
| 10 | Why I love you | 3 reason cards |
| 11 | Our moments | Aapki photos album |
| 12 | Wishes for you | Raat wali duaayein |
| 13 | Celebration | Dance lines |
| 14 | My letter | Mohabbat ka romantic letter (typewriter) |
| 15 | My King ðŸ‘‘ | Birthday boy ki photos gallery |
| 16 | Make a wish | Wish + burst |
| 17 | Final surprise | Last lines + title |

## Photos kahan daalni hain
**1 Â· Birthday boy ki photos (page 15 â€” "My King")**
```
assets/photos/photo1.webp   â† 1st.webp yahan move kar diya gaya hai
assets/photos/photo2.webp
...
assets/photos/photo8.webp
```
Naam `photo1â€¦photoN` rakhte jao â€” khud load ho jayengi. Har photo ke saath ek
romantic caption aata hai (`KING_CAPTIONS` in `js/script.js`).
Photo par tap karo â†’ full screen lightbox.

**2 Â· Beech ki photos (page 11 â€” "Our Moments")**
```
assets/moments/moment1.jpg
assets/moments/moment2.jpg
...
```
Naam `moment1â€¦momentN`. `.jpg / .jpeg / .png / .webp` â€” sab chalte hain.
`assets/moments/` khaali ho to album **`assets/photos/photo1.webpâ€¦` se khud bhar
jata hai** â€” matlab abhi page 11 par wahi 8 pics dikh rahi hain (copy nahi bani).
Moment files daal do to wo pehle se chalne lagengi.

**3 Â· Kisi bhi scene me ek photo (optional)**
Har scene me ek hidden slot hai. Agar `assets/moments/scene7.jpg` bana dogi to
scene 7 me photo khud aa jayegi â€” warna slot chhupa rehta hai.

```
assets/moments/scene1.jpg  â†’ page 1
assets/moments/scene5.jpg  â†’ page 5
assets/moments/scene14.jpg â†’ page 14
```

## Stickers (Bubu & Dudu)
`assets/characters/` me GIF / WebP / MP4 / WebM / PNG daalo. Har scene apni matching
file **khud apni sahi jagah** laga leti hai â€” koi galat scene par sticker nahi jayega.

**Sabse aasaan tareeka:** file ka naam wahi rakho jo neeche diya hai (jaise `wave.gif`,
`hug.mp4`). Extension koi bhi ho sakti hai â€” `.gif .webp .mp4 .webm .png`.

**Scene number se bhi chalta hai:** `1.gif` â†’ scene 1, `5.mp4` â†’ scene 5 â€¦ `17.gif`.

**Agar tumhara naam list me nahi hai** to `assets/characters/manifest.json` me us scene
ke id ke saamne filename likh do, ya sab ke liye ek hi sticker chahiye to `"default"`.

| Scene | Page | Slot (HTML id) | Pehli pasand | Ye bhi chalega |
|-------|------|----------------|-------------|----------------|
| 1 Welcome | 1 | `char-welcome` | `wave` | welcome Â· hello Â· hi Â· greeting Â· `1` |
| 2 Secret surprise | 2 | `char-surprise` | `surprise` | secret Â· peek Â· reveal Â· `2` |
| 3 Special day | 3 | `char-celebrate` | `celebration` | celebrate Â· cheer Â· party Â· `3` |
| 4 Happy birthday | 4 | `char-birthday` | `birthday` | happy-birthday Â· birthday-cake Â· `4` |
| 5 Virtual hug | 5 | `char-hug` | `hug` | hugging Â· hugs Â· `5` |
| 6 You mean so much | 6 | `char-love` | `love` | in-love Â· hearts Â· romantic Â· `6` |
| 7 You make me smile | 7 | `char-smile` | `smile` | smiling Â· laugh Â· happy Â· `7` |
| 8 Favorite person | 8 | `char-fav` | `emotional` | favourite Â· favorite Â· crush Â· love Â· `8` |
| 9 Always there | 9 | `char-there` | `comfort` | support Â· embrace Â· care Â· `9` |
| 12 Wishes | 12 | `char-wish` | `wish` | stars Â· magic Â· dua Â· `12` |
| 13 Celebration | 13 | `char-dance` | `dance` | dancing Â· party Â· celebrate Â· `13` |
| 14 Letter | 14 | `char-letter` | `gift` | letter Â· love-letter Â· `14` |
| 16 Make a wish | 16 | `char-cake` | `cake` | candle Â· birthday-cake Â· make-a-wish Â· `16` |
| 17 Final surprise | 17 | `char-final` | `final-love` | final Â· kiss Â· love Â· hug Â· `17` |

Saare naam ek hi list me se prefer hote hain â€” matlab `wave.mp4` bhi scene 1 par sahi
lagega. File na mile to us scene ka slot chhupa rehta hai (khaali/toota box nahi dikhta)
aur console me likh aata hai ki kaunsi file daalni hai.

**Abhi jo hain:** `1.webp â€¦ 7.webp` â†’ scene 1 se 7 (welcome se "you make me smile" tak).
Baaki scenes (8â€“17) ke liye bas `8.webp â€¦ 17.webp` naam se files daal do â€” apne aap
lag jayengi, kuch code change karne ki zaroorat nahi.

Page enter hote hi usi page ka sticker load hota hai (poore 14 ek saath nahi), aur sirf
current page ka video chalta hai â€” background me koi sticker nahi chalta.



## Music
Koi MP3 ki zaroorat nahi â€” `js/script.js` me **built-in soft romantic melody** hai
(Web Audio se banti hai: soft pad + music-box bells + bass, Fmaj7 â†’ Cmaj7 â†’ Dm7 â†’ Bbmaj7).
â™« button se on/off hota hai.

Agar apni MP3 use karni ho to `assets/music/birthday.mp3` rakh do â€” wo detect hokar
automatically use ho jayegi.

## Letter badalna
Letter ka text `LETTER_LINES` array me hai (`js/script.js`). Har line ka ek paragraph
hai; khaali string `''` paragraph ka break deti hai. Typewriter chhodhna ho to
letter card par tap kar do.

## Structure
```
wish/
â”œâ”€â”€ index.html
â”œâ”€â”€ css/style.css
â”œâ”€â”€ js/script.js
â””â”€â”€ assets/
    â”œâ”€â”€ characters/   â† stickers (gif/webp/mp4) + manifest.json
    â”œâ”€â”€ photos/       â† photo1â€¦photoN  â†’ page 15 "My King"
    â”œâ”€â”€ moments/      â† moment1â€¦N (page 11) + sceneN (per scene)
    â””â”€â”€ music/        â† optional birthday.mp3
```

## Notes
- Kahi scroll nahi hota, sirf gallery ke andar scroll hota hai.
- Progress indicator `1 / 17`, music toggle, pehli aur aakhri page par BACK chhupa.
- Last page ka NEXT button **REPLAY** ban jata hai.
- Stickers kabhi stretch ya crop nahi hote (`object-fit: contain`).