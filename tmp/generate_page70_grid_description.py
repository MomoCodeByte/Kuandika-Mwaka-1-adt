import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
text='Picha tano zimepangwa kwenye kisanduku. Kwanza, mtoto anakaa na kupika kwenye jiko. Pili, mtoto anasukuma toroli iliyojaa udongo. Tatu, mtoto anaokota na kubeba kuni. Nne, mtoto amekaa mezani akiandika. Tano, wasichana wawili wamekaa kwenye meza na wanaandika pamoja.'
asyncio.run(edge_tts.Communicate(text,'sw-TZ-RehemaNeural').save(str(ROOT/'content/i18n/sw-TZ/audio/pg070_picture_grid_audio_description.mp3')))
