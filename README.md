## IFT 6256 - Assignment 3 (Generative Art Inspired by Data)
### *Seeds of Life* by Michaël Gugliandolo

<br>

To view my project, opening `index.html` directly in your web browser may fail due to the browser's CORS policy blocking the CSV and PNG file imports. Instead, you can use VS Code with the "Live Server" extension: right-click `index.html` and select "Open with Live Server".

> [!TIP]
> Press **SPACE** to pause the animation. Use the **right arrow** key to jump forward 20 years and the **left arrow** key to jump backward 20 years.

<hr>

Pour voir mon projet, ouvrir `index.html` directement dans votre navigateur web peut échouer à cause de la politique CORS qui bloque l'importation du fichier JSON. Au lieu, vous pouvez utiliser VS Code avec l'extension "Live Server": faites un clic droit sur `index.html` et sélectionnez "Open with Live Server".

> [!TIP]
> Appuyez sur **ESPACE** pour mettre l'animation en pause. Utilisez la **flèche droite** pour avancer de 20 ans et la **flèche gauche** pour reculer de 20 ans.

<hr>

### Examples/exemples

Realistic birth rates/taux de natalité réalistes:
<img alt="Render with realistic birth rates" src="/examples/drops-realistic-birth-rates.jpg" />

20x birth rates/taux de natalité multipliés par 20:
<img alt="Render with 20 times the birth rates" src="/examples/drops-20x-birth-rates.jpg" />

<hr>

### Transposition des données en visuel

Mon projet utilise la pluie pour représenter la démographie mondiale en faisant tomber une goutte d'eau pour chaque naissance. Je calcule le nombre de naissances par seconde par pays à partir des taux de natalité et de la population totale, provenant des données d'OWID. J'utilise cette fréquence pour la probabilité d'apparition d'une goutte à chaque frame de l'animation. J'augmente les années de 1900 à 2023 pour visualiser les naissances augmenter avec le temps. Malheureusement, les données combinant tous les pays commencent seulement en 1950; il y a très peu de pays avec des données avant 1950. Enfin, j'obtiens les frontières longitudinales du territoire principal de chaque pays avec Natural Earth. Pour chaque naissance, une coordonnée est choisie aléatoirement entre les longitudes minimale et maximale du pays.

<hr>

### Sources
Birth rates:
- Human Mortality Database (2025); UN, World Population Prospects (2024) – processed by Our World in Data. “Birth rate – HMD, UN WPP – total” [dataset]. Human Mortality Database, “Human Mortality Database”; United Nations, “World Population Prospects” [original data]. Retrieved March 6, 2026 from https://archive.ourworldindata.org/20260304-094028/grapher/long-run-birth-rate.html (archived on March 4, 2026).

Population:
- HYDE (2023); Gapminder (2022); UN WPP (2024) – with major processing by Our World in Data. “Population – HYDE, Gapminder, UN – Long-run data” [dataset]. PBL Netherlands Environmental Assessment Agency, “History Database of the Global Environment 3.3”; Gapminder, “Population v7”; United Nations, “World Population Prospects”; Gapminder, “Systema Globalis” [original data]. Retrieved March 6, 2026 from https://archive.ourworldindata.org/20260304-094028/grapher/population.html (archived on March 4, 2026).

Country longitudes:
- Data from Natural Earth. Free vector and raster map data @ [naturalearthdata.com](https://www.naturalearthdata.com/).
