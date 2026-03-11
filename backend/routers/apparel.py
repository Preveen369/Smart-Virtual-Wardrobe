from fastapi import APIRouter
import csv
import os

router = APIRouter()

# Load CSV data
def load_apparel_data():
    csv_path = os.path.join(os.path.dirname(__file__), '../utils/apparel_only.csv')
    apparel_data = []
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                apparel_data.append(row)
    except Exception as e:
        print(f"Error loading CSV: {e}")
    return apparel_data

APPAREL_DATA = load_apparel_data()

@router.get('/apparel/filters')
def get_filter_options():
    """Get unique values for all filter options"""
    if not APPAREL_DATA:
        return {}
    
    genders = set()
    subcategories = set()
    article_types = set()
    seasons = set()
    usages = set()
    colors = set()
    
    for item in APPAREL_DATA:
        if item.get('gender'):
            genders.add(item['gender'])
        if item.get('subCategory'):
            subcategories.add(item['subCategory'])
        if item.get('articleType'):
            article_types.add(item['articleType'])
        if item.get('season'):
            seasons.add(item['season'])
        if item.get('usage'):
            usages.add(item['usage'])
        if item.get('baseColour'):
            colors.add(item['baseColour'])
    
    return {
        "genders": sorted(list(genders)),
        "subcategories": sorted(list(subcategories)),
        "articleTypes": sorted(list(article_types)),
        "seasons": sorted(list(seasons)),
        "styles": sorted(list(usages)),
        "colors": sorted(list(colors))
    }

@router.get('/apparel/products')
def get_filtered_products(
    gender: str = None,
    subcategory: str = None,
    article_type: str = None,
    season: str = None,
    style: str = None,
    color: str = None
):
    """Get filtered products from the apparel CSV"""
    filtered = APPAREL_DATA
    
    if gender and gender != "all":
        filtered = [item for item in filtered if item.get('gender') == gender]
    
    if subcategory and subcategory != "all":
        filtered = [item for item in filtered if item.get('subCategory') == subcategory]
    
    if article_type and article_type != "all":
        filtered = [item for item in filtered if item.get('articleType') == article_type]
    
    if season and season != "all":
        filtered = [item for item in filtered if item.get('season') == season]
    
    if style and style != "all":
        filtered = [item for item in filtered if item.get('usage') == style]
    
    if color and color != "all":
        filtered = [item for item in filtered if item.get('baseColour') == color]
    
    # Return up to 5 matching products
    return {
        "count": len(filtered),
        "products": [
            {
                "productDisplayName": item.get('productDisplayName'),
                "gender": item.get('gender'),
                "subCategory": item.get('subCategory'),
                "articleType": item.get('articleType'),
                "season": item.get('season'),
                "usage": item.get('usage'),
                "baseColour": item.get('baseColour')
            }
            for item in filtered[:5]
        ]
    }
