Control Horas Juan v2 - Offline PWA
-----------------------------------
Versión: Control Horas Juan v2
Este paquete contiene una PWA instalable que permite fichar con un toque (entrada/salida),
tiene cronómetros separados para mañana y tarde, guardado automático y exportación offline.

Archivos incluidos:
- index.html
- styles.css
- app_v2.js
- manifest.json
- sw.js
- icon.png
- xlsx.full.min.js (stub local para exportar; genera CSV-like if real XLSX not available)
- README.txt

Instrucciones:
1) Descomprime el ZIP en tu ordenador o sube la carpeta a un hosting estático.
2) Abre index.html en Safari en tu iPhone y usa "Compartir -> Añadir a pantalla de inicio".
3) La app funciona offline. Los datos se guardan en localStorage del navegador.
4) El cronómetro sigue activo aunque cierres la app: se guarda el timestamp de inicio en localStorage y se calcula el tiempo transcurrido al volver a abrir.
