# Ripoti ya marekebisho — Kuandika Mwaka wa Kwanza

Tarehe ya ukaguzi: 27 Agosti 2026

Prompt ya matamshi ya konsonanti imehifadhiwa kwenye [REHEMA-KONSONANTI-PROMPT.md](REHEMA-KONSONANTI-PROMPT.md), ikiwa na orodha ya herufi, mapumziko na kanuni za `ch`, `ngw`, `ndu` na `mb`.

Audio 119 za maandishi yenye irabu/konsonanti zilizotengwa zimetengenezwa upya kwa matamshi ya jina la herufi (kwa mfano `b m d k n` → “bee … mee … dee … kaa … nee”), bila kubadilisha maandishi yanayoonekana.

## Vilivyokamilika

- Maelezo ya picha kwa wanafunzi wasioona yameongezwa/kuboreshwa kwenye kurasa 7–19, 34, 44, 45, 54, 57–60, 69–77, 85–86, 91, 93–95 na 102.
- Sauti za maelezo hayo zimetengenezwa kwa Rehema na kuunganishwa kwenye `texts.json` na `audios.json`.
- Matamshi ya irabu na makundi ya konsonanti yamewekewa mapumziko ili yasomeke moja baada ya nyingine: `aaa … eee … iii … ooo … uuu`, pamoja na mifano ya `ngw`, `ndu`, `mb` na makundi mengine.
- Maelezo ya kurasa 70, 94, 95 na 102 yamehakikiwa dhidi ya picha halisi.
- Layout ya original ya ukurasa 96 imehifadhiwa; maelezo ya juu hayajabadilishwa.
- Marekebisho ya mwandiko wa ukurasa 54 na maelezo ya mifano ya kurasa 57–60, 85–86 yamehifadhiwa.
- Maelezo na sauti za mifano ya herufi K, N, L na T kwenye kurasa 60, 61, 64 na 65 zimefafanuliwa zaidi; sasa zinataja herufi kubwa, nukta za kufuatisha na mistari ya mwandiko.
- Maelezo na sauti za mifano ya herufi P na S kwenye kurasa 66 na 67 zimefafanuliwa zaidi, bila kubadilisha mpangilio wa kitabu.
- Maelezo na sauti za mifano ya Z, H na CH kwenye kurasa 73, 75 na 78 zimefafanuliwa zaidi; preview ya ukurasa 73 imehakikisha alama za ufikivu zinaonyesha maelezo mapya.
- Ukurasa 68 umeongezewa maelezo ya picha na sauti kwa sehemu ya herufi F, majina na sentensi za mfano.
- Sauti ya maagizo ya ukurasa 9 (“Chora mchoro huu kwenye daftari.”) imetengenezwa upya ikiwa sentensi moja na imewekewa cache mpya ili kuzuia kurudiwa.
- Kurasa 52, 53, 55 na 56 zimeongezewa maelezo yaliyosawazishwa ya mifano ya irabu A, E, O na U pamoja na sauti mpya za maelezo.
- Ukurasa 96 sasa una kitufe kimoja cha “Sikiliza ukurasa” kinachocheza maudhui yote ya ukurasa kwa mpangilio kwa sauti ya Rehema; hakijaongeza controller za kurudia.
- Ukurasa 102 sasa una kitufe kimoja cha “Sikiliza maelezo ya picha”, na preview imehakikisha kitufe na maelezo ya kina vinaonekana.
- Ukurasa 96 na 102 zimejaribiwa tena: vitufe vinaonekana, kubofya huanzisha sauti, na faili za sauti zipo kwenye folda ya kitabu.
- Ukurasa 100/101: swali la tano la zoezi la nne limeondolewa bold, na maudhui yanayojirudia yameondolewa.
- Ukurasa 103, Zoezi la Sita: sehemu ya kujibia imewekewa mistari ya daftari (mstari mzito, mistari miwili midogo na mstari wa chini), huku canvas ya kuandikia na kitufe kimoja cha “Futa jibu” vikiendelea kufanya kazi.
- Ukurasa 13: maagizo ya zoezi sasa yanataja moja kwa moja irabu inayotakiwa—“Andika herufi ya irabu u kwenye daftari”—ili msomaji asiyeona ajue jibu la kuandika.
- Muonekano wa kurasa umeondolewa gradient/mipaka ya samawati ya pembeni; msingi sasa ni mweupe na responsive, huku maelezo ya picha, `alt` text na `aria-label` vikibaki kwa screen reader.

## Ukaguzi wa kiufundi

- `writing-activities.js` inapita `node --check`.
- `texts.json` na `audios.json` ni JSON halali.
- Ukaguzi wa faili umeonyesha hakuna audio iliyoorodheshwa bila faili lake (`missing 0`).
- Ukaguzi wa mwisho umeonyesha michoro yote 229 inayotumika moja kwa moja kwenye HTML ina maelezo na faili la audio linalolingana; picha ya zoezi la Uk. 43 iliyokuwa inline imeongezewa pia usajili wa maelezo na sauti.
- Audit ya tarehe 28/08/2026 imethibitisha tena michoro 229/229 ya HTML ina `data-adt-description`, kitambulisho cha audio, na faili la MP3 linalopatikana; Uk. 9 (mchoro wa herufi a) umehakikiwa moja kwa moja.
- Hakuna mabadiliko ya layout yaliyofanywa kwenye sehemu za original bila sababu.

## Preview za kukagua

- [Index ya preview zote](http://127.0.0.1:8885/preview-index.html?final=20260827)

- [Ukurasa 70](http://127.0.0.1:8885/pg070_sec001.html?descriptions=20260826-page70-final)
- [Ukurasa 94](http://127.0.0.1:8885/pg094_sec001.html?descriptions=20260826-page94-final)
- [Ukurasa 95](http://127.0.0.1:8885/pg095_sec001.html?descriptions=20260826-page95-final)
- [Ukurasa 102](http://127.0.0.1:8885/pg102_sec001.html?scene-description=20260826-final-3)
- [Ukurasa 96 — audio ya ukurasa](http://127.0.0.1:8885/pg096_sec001.html?audio-playlist=20260827)
- [Ukurasa 102 — audio ya picha](http://127.0.0.1:8885/pg102_sec001.html?scene-audio=20260827)

## Kinachobaki kabla ya kufunga kazi

- Ukaguzi wa mwisho wa kurasa zote 6–105 kwenye browser bado unapendekezwa kabla ya kuchapisha.
