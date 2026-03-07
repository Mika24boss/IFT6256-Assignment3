import pandas as pd
import geopandas as gpd

SECONDS_PER_YEAR = 365.25 * 24 * 3600
TOP_COUNTRIES_AMOUNT = 500

# Combine birth rate and population datasets to calculate births per second
birth_rate = pd.read_csv("data/OWID-long-run-birth-rate.csv")
population = pd.read_csv("data/OWID-population.csv")

# Keep countries and remove aggregated groups
population = population[population["code"].notna()]
population = population[population["code"] != "OWID_WRL"]

full_data = birth_rate.merge(
    population,
    on=["entity","code","year"],
    how="inner"
)

full_data["births_per_second"] = (full_data["birth_rate_hist"] / 1000) * full_data["population_historical"] / SECONDS_PER_YEAR
births_per_second = full_data[["entity", "code", "year", "births_per_second"]]

# Get top countries by births per second in the latest year
latest_year = births_per_second["year"].max()
top_names = (
    births_per_second[births_per_second["year"] == latest_year]
    .sort_values("births_per_second", ascending=False)
    .head(TOP_COUNTRIES_AMOUNT)
)["entity"].tolist()

births_per_second = births_per_second[births_per_second["entity"].isin(top_names)]

#---------------------------------------------------------------------------------#

# Get longitudes for countries
map_data = gpd.read_file("data/NATURAL_EARTH_50m_admin_0_countries.zip")

# Choose the part with the largest area
def get_mainland_bounds(geom):
    if geom.geom_type == "MultiPolygon":
        mainland = max(geom.geoms, key=lambda g: g.area)
    else:
        mainland = geom
    return mainland.bounds  # minx, miny, maxx, maxy

bounds = map_data.geometry.apply(get_mainland_bounds)
country_longitudes = pd.DataFrame({
    "entity": map_data["ADMIN"],
    "code": map_data["ADM0_A3"],
    "min_long": bounds.str[0],
    "max_long": bounds.str[2]
})

# Correct discrepancies in country codes, prioritizing the OWID codes
code_corrections = {
    "KOS": "OWID_KOS", # Kosovo
    "PSX": "PSE", # Palestine
    "SDS": "SSD", # South Sudan
    "SAH": "ESH" # Western Sahara
}
country_longitudes['code'] = country_longitudes['code'].replace(code_corrections)

# Eliminate the countries without longitudes
births_per_second = births_per_second[births_per_second['code'].isin(country_longitudes['code'])]

country_longitudes.sort_values(by="entity").to_csv("data/country_longitudes.csv", index=False)
births_per_second.to_csv("data/births_per_second.csv", index=False)