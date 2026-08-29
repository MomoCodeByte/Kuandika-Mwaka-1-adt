# Batch D: Kurasa 80–104 — audit na proof

Tarehe: 29 Agosti 2026

## Kilichokaguliwa

- Ufikivu wa maelezo ya picha kwa screen reader.
- Uwepo wa audio-description controllers.
- Maandishi ya mazoezi na mpangilio wa kurasa 80–104.
- Responsive overflow ya ukurasa.

## Matokeo

| Ukurasa | Picha/maelezo | Matokeo |
|---|---|---|
| 80–93 | Maudhui ya herufi, konsonanti, sentensi na mazoezi | Yanaonekana na kusomeka; hakuna picha zinazohitaji audio-description. |
| 94 | Picha 2 | Kila picha ina maelezo ya Kiswahili na controller ya kusikiliza. |
| 95 | Picha 3 | Kila picha ina maelezo ya Kiswahili na controller ya kusikiliza. |
| 96 | Picha ya kichwa cha kitabu | Imetambulishwa kama picha ya mapambo (aria-hidden), hivyo haisumbui screen reader. |
| 97–101 | Maandishi/mazoezi | Yanasomeka; hakuna picha za maudhui zilizokosa maelezo. |
| 102 | Picha 3 + mchoro wa mazungumzo | Maelezo ya kila picha na mchoro mzima yana controller ya kusikiliza; controller chaguo-msingi inaonekana. |
| 103–104 | Mazoezi na mistari ya majibu | Maandishi na controls vinaonekana; mpangilio wa zoezi la nane unafuata zoezi lililotangulia. |

## Browser proof

- Kurasa 94, 95 na 102 zilifunguliwa kwenye browser ya ndani.
- data-adt-audio-description-id ilithibitishwa kwa picha zote za maudhui.
- Controls za “Cheza”, “Simamisha” na “Sauti” zilionekana.
- Responsive check: scrollWidth === clientWidth (hakuna horizontal overflow) kwenye kurasa zilizojaribiwa.

## Kumbukumbu

Ufafanuzi wa picha unatumia bridge ya kawaida ya kitabu ili kila img yenye data-adt-description ipate kitufe cha kusikiliza bila kuongeza controller ya ziada.