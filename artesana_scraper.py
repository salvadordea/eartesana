#!/usr/bin/env python3
"""
Scraper para Estudio Artesana
Descarga imágenes de productos organizadas por Categoria/producto/variante
"""

import requests
from bs4 import BeautifulSoup
import os
import urllib.parse
from pathlib import Path
import time
import json
import argparse
from typing import List, Dict, Tuple
import re
import csv

class ArtesanaScraper:
    def __init__(self, base_url: str = "http://estudioartesana.local", delay: float = 1.0):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.delay = delay
        self.downloaded_images = set()
        
    def get_page(self, url: str) -> BeautifulSoup:
        """Obtiene y parsea una página"""
        try:
            response = self.session.get(url)
            response.raise_for_status()
            time.sleep(self.delay)
            return BeautifulSoup(response.content, 'html.parser')
        except Exception as e:
            print(f"Error obteniendo {url}: {e}")
            return None
    
    def get_categories(self) -> List[Dict]:
        """Obtiene las categorías de productos"""
        print("🔍 Buscando categorías de productos...")
        
        categories = []
        shop_url = f"{self.base_url}/tienda"
        soup = self.get_page(shop_url)
        
        if not soup:
            return categories
            
        # Buscar enlaces de categorías
        category_links = soup.find_all('a', href=re.compile(r'/product-category/'))
        
        for link in category_links:
            href = link.get('href')
            if href:
                # Extraer nombre de categoría de la URL
                category_slug = href.split('/product-category/')[-1].strip('/')
                category_name = category_slug.replace('-', ' ').title()
                
                # Obtener texto del enlace si está disponible
                if link.get_text(strip=True):
                    category_name = link.get_text(strip=True)
                
                full_url = href if href.startswith('http') else self.base_url + href
                
                categories.append({
                    'name': category_name,
                    'slug': category_slug,
                    'url': full_url
                })
        
        # Eliminar duplicados
        seen = set()
        unique_categories = []
        for cat in categories:
            if cat['slug'] not in seen:
                seen.add(cat['slug'])
                unique_categories.append(cat)
        
        print(f"✅ Encontradas {len(unique_categories)} categorías")
        return unique_categories
    
    def get_products_from_category(self, category: Dict) -> List[Dict]:
        """Obtiene productos de una categoría"""
        print(f"📦 Buscando productos en '{category['name']}'...")
        
        products = []
        soup = self.get_page(category['url'])
        
        if not soup:
            return products
        
        # Buscar enlaces de productos
        product_links = soup.find_all('a', href=re.compile(r'/product/'))
        
        for link in product_links:
            href = link.get('href')
            if href and '/product/' in href:
                # Extraer slug del producto
                product_slug = href.split('/product/')[-1].strip('/')
                product_name = product_slug.replace('-', ' ').title()
                
                # Buscar nombre del producto en el texto del enlace o título
                if link.get_text(strip=True):
                    product_name = link.get_text(strip=True)
                elif link.get('title'):
                    product_name = link.get('title')
                
                full_url = href if href.startswith('http') else self.base_url + href
                
                products.append({
                    'name': product_name,
                    'slug': product_slug,
                    'url': full_url,
                    'category': category['slug']
                })
        
        # Eliminar duplicados
        seen = set()
        unique_products = []
        for prod in products:
            if prod['slug'] not in seen:
                seen.add(prod['slug'])
                unique_products.append(prod)
        
        print(f"✅ Encontrados {len(unique_products)} productos en '{category['name']}'")
        return unique_products
    
    def get_product_variants_and_images(self, product: Dict) -> Dict:
        """Obtiene variantes e imágenes específicas de un producto"""
        print(f"🎨 Analizando producto '{product['name']}'...")
        
        soup = self.get_page(product['url'])
        if not soup:
            return {'variants': {}, 'main_image': None}
        
        product_data = {
            'variants': {},  # Cambiar a dict para mapear variante -> imagen específica
            'main_image': None  # Imagen principal del producto
        }
        
        # Buscar imagen principal del producto
        main_img = None
        # Buscar imagen con clase zoomImg (imagen principal)
        zoom_img = soup.find('img', class_='zoomImg')
        if zoom_img and zoom_img.get('src'):
            main_img = zoom_img.get('src')
        
        # Si no encuentra zoomImg, buscar otras imágenes principales comunes
        if not main_img:
            # Buscar en contenedores típicos de imagen principal
            main_containers = soup.find_all(['div', 'figure'], class_=re.compile(r'(product-image|main-image|featured-image|woocommerce-product-gallery)'))
            for container in main_containers:
                img = container.find('img')
                if img and img.get('src'):
                    src = img.get('src')
                    if any(ext in src.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                        main_img = src
                        break
        
        if main_img:
            # Convertir URL relativa a absoluta si es necesario
            if not main_img.startswith('http'):
                main_img = self.base_url + main_img
            product_data['main_image'] = main_img
            print(f"  📸 Imagen principal encontrada: {main_img}")
        
        # Buscar contenedor específico de swatches cfvsw
        swatch_container = soup.find('div', class_='cfvsw-swatches-container')
        
        variants_found = False
        if swatch_container:
            # Buscar swatches individuales con clase cfvsw-swatches-option
            swatches = swatch_container.find_all('div', class_='cfvsw-swatches-option')
            print(f"  🔍 Encontrados {len(swatches)} swatches cfvsw")
            
            for swatch in swatches:
                variant_name = None
                variant_image = None
                
                # Obtener nombre de la variante desde atributos data-*
                if swatch.get('data-title'):
                    variant_name = swatch.get('data-title')
                elif swatch.get('data-slug'):
                    variant_name = swatch.get('data-slug').replace('-', ' ').title()
                elif swatch.get('data-tooltip'):
                    variant_name = swatch.get('data-tooltip')
                
                # Buscar imagen específica en el div interno cfvsw-swatch-inner
                inner_div = swatch.find('div', class_='cfvsw-swatch-inner')
                if inner_div and inner_div.get('style'):
                    style = inner_div.get('style')
                    # Buscar background-image en el style
                    url_match = re.search(r"background-image:url\(['\"]?([^'\"\)]+)['\"]?\)", style)
                    if url_match:
                        variant_image = url_match.group(1)
                
                if variant_name and variant_image:
                    # Convertir URL relativa a absoluta si es necesario
                    if not variant_image.startswith('http'):
                        variant_image = self.base_url + variant_image
                    
                    product_data['variants'][variant_name.strip()] = [variant_image]
                    variants_found = True
                    print(f"  🎨 {variant_name}: {variant_image}")
        else:
            print("  ⚠️ No se encontró contenedor cfvsw-swatches-container")
        
        # Si no encontramos swatches con imágenes específicas, usar método fallback
        if not variants_found:
            print("  ⚠️ No se encontraron swatches con imágenes específicas, usando método alternativo...")
            
            # Buscar variantes por nombres de colores
            variant_names = []
            text_content = soup.get_text().lower()
            color_patterns = [
                'beige', 'café', 'chocolate', 'negro', 'blanco', 'rojo', 'azul', 'verde',
                'amarillo', 'rosa', 'morado', 'gris', 'marrón', 'naranja', 'crema'
            ]
            
            for color in color_patterns:
                if color in text_content:
                    variant_names.append(color.title())
            
            # Si no hay variantes por color, usar default
            if not variant_names:
                variant_names = ['default']
            
            # Buscar imágenes principales del producto
            main_images = []
            
            # Buscar en galería principal
            gallery_images = soup.find_all('img')
            for img in gallery_images:
                src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                if src:
                    # Filtrar imágenes relevantes
                    if any(keyword in src.lower() for keyword in ['upload', 'wp-content/uploads']):
                        if not any(skip in src.lower() for skip in ['logo', 'icon', 'banner', 'header', 'flag']):
                            if any(ext in src.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                                full_img_url = src if src.startswith('http') else self.base_url + src
                                if full_img_url not in main_images:
                                    main_images.append(full_img_url)
            
            # Asignar imágenes a variantes
            for variant_name in variant_names:
                product_data['variants'][variant_name] = main_images[:3]  # Máximo 3 imágenes por variante
        
        # Si aún no hay variantes, crear una por defecto
        if not product_data['variants']:
            product_data['variants'] = {'default': []}
        
        total_images = sum(len(images) for images in product_data['variants'].values())
        print(f"✅ Producto '{product['name']}': {len(product_data['variants'])} variantes, {total_images} imágenes totales")
        return product_data
    
    def clean_product_name(self, product_name: str) -> str:
        """Limpia el nombre del producto removiendo precios"""
        # Remover patrones de precio como MXN $480.00, $480, etc.
        cleaned = re.sub(r'MXN\s*\$[\d,]+\.?\d*', '', product_name)
        cleaned = re.sub(r'\$[\d,]+\.?\d*', '', cleaned)
        # Remover espacios extra
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned
    
    def sanitize_filename(self, filename: str) -> str:
        """Sanitiza nombres de archivo para Windows"""
        # Remover caracteres problemáticos
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        # Limitar longitud
        if len(filename) > 100:
            filename = filename[:100]
        return filename.strip()
    
    def download_image(self, url: str, filepath: Path) -> bool:
        """Descarga una imagen"""
        # Si ya descargamos esta URL, no la volvemos a descargar
        if url in self.downloaded_images:
            return True
        
        # Si el archivo ya existe, no lo volvemos a descargar
        if filepath.exists():
            print(f"⏭️  Ya existe: {filepath}")
            self.downloaded_images.add(url)
            return True
            
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            # Crear directorio si no existe
            filepath.parent.mkdir(parents=True, exist_ok=True)
            
            # Escribir archivo
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            self.downloaded_images.add(url)
            time.sleep(self.delay)
            return True
            
        except Exception as e:
            print(f"❌ Error descargando {url}: {e}")
            return False
    
    def scrape_products(self, dry_run: bool = False, max_products: int = None) -> Dict:
        """Scraping principal"""
        print("🚀 Iniciando scraping de Estudio Artesana")
        print(f"📍 URL base: {self.base_url}")
        print(f"🔧 Modo: {'DRY RUN' if dry_run else 'DESCARGA'}")
        
        results = {
            'categories': [],
            'total_products': 0,
            'total_images': 0,
            'errors': []
        }
        
        # Obtener categorías
        categories = self.get_categories()
        if not categories:
            print("❌ No se encontraron categorías")
            return results
        
        product_count = 0
        
        for category in categories:
            print(f"\n📂 Procesando categoría: {category['name']}")
            
            category_data = {
                'name': category['name'],
                'slug': category['slug'],
                'products': []
            }
            
            # Obtener productos de la categoría
            products = self.get_products_from_category(category)
            
            for product in products:
                if max_products and product_count >= max_products:
                    print(f"🔄 Límite alcanzado: {max_products} productos")
                    break
                
                product_count += 1
                print(f"\n📦 Producto {product_count}: {product['name']}")
                
                # Obtener variantes e imágenes
                product_info = self.get_product_variants_and_images(product)
                
                product_data = {
                    'name': product['name'],
                    'slug': product['slug'],
                    'variants': product_info['variants'],
                    'downloaded_images': []
                }
                
                if not dry_run:
                    # Limpiar nombre del producto (quitar precio)
                    clean_product_name = self.clean_product_name(product['name'])
                    
                    # Descargar imagen principal como principal.jpg
                    if product_info.get('main_image'):
                        main_img_url = product_info['main_image']
                        
                        # Obtener extensión de archivo
                        parsed_url = urllib.parse.urlparse(main_img_url)
                        file_ext = os.path.splitext(parsed_url.path)[1] or '.jpg'
                        
                        # Crear path para imagen principal
                        main_img_path = Path("scraper") / self.sanitize_filename(category['name']) / self.sanitize_filename(clean_product_name) / f"principal{file_ext}"
                        
                        if self.download_image(main_img_url, main_img_path):
                            product_data['downloaded_images'].append(str(main_img_path))
                            results['total_images'] += 1
                            print(f"✅ Imagen principal: {main_img_path}")
                        else:
                            results['errors'].append(f"Error descargando imagen principal {main_img_url}")
                    
                    # Descargar una imagen por variante directamente como archivo
                    if product_info['variants']:
                        for variant_name, variant_images in product_info['variants'].items():
                            if variant_images:  # Solo si hay imágenes para esta variante
                                # Tomar solo la primera imagen de cada variante
                                img_url = variant_images[0]
                                
                                # Obtener extensión de archivo
                                parsed_url = urllib.parse.urlparse(img_url)
                                file_ext = os.path.splitext(parsed_url.path)[1] or '.jpg'
                                
                                # Crear path: scraper/Categoria/Producto/variante.ext
                                variant_clean = self.sanitize_filename(variant_name)
                                img_filename = f"{variant_clean}{file_ext}"
                                img_path = Path("scraper") / self.sanitize_filename(category['name']) / self.sanitize_filename(clean_product_name) / img_filename
                                
                                if self.download_image(img_url, img_path):
                                    product_data['downloaded_images'].append(str(img_path))
                                    results['total_images'] += 1
                                    print(f"✅ Variante: {img_path}")
                                else:
                                    results['errors'].append(f"Error descargando {img_url}")
                
                category_data['products'].append(product_data)
                
                if max_products and product_count >= max_products:
                    break
            
            results['categories'].append(category_data)
            results['total_products'] += len(category_data['products'])
            
            if max_products and product_count >= max_products:
                break
        
        return results
    
    def save_csv_report(self, results: Dict, filename: str = "scraper/productos_scrapeados.csv") -> None:
        """Guarda un reporte CSV con toda la información scrapeada"""
        print(f"📄 Generando reporte CSV: {filename}")
        
        # Crear directorio si no existe
        Path(filename).parent.mkdir(parents=True, exist_ok=True)
        
        # Preparar datos para CSV
        csv_data = []
        
        for category in results['categories']:
            for product in category['products']:
                # Una fila por cada variante del producto
                for variant_name, variant_images in product['variants'].items():
                    # Filtrar rutas descargadas para esta variante específica
                    variant_paths = [path for path in product['downloaded_images'] 
                                   if self.sanitize_filename(variant_name) in path]
                    
                    row = {
                        'categoria': category['name'],
                        'categoria_slug': category['slug'],
                        'producto': product['name'],
                        'producto_slug': product['slug'],
                        'variante': variant_name,
                        'precio': self.extract_price(product['name']),
                        'total_imagenes': len(variant_images),
                        'imagenes_descargadas': len(variant_paths),
                        'urls_imagenes': ' | '.join(variant_images),
                        'rutas_descargadas': ' | '.join(variant_paths),
                    }
                    csv_data.append(row)
        
        # Escribir CSV
        if csv_data:
            fieldnames = ['categoria', 'categoria_slug', 'producto', 'producto_slug', 'variante', 'precio', 
                         'total_imagenes', 'imagenes_descargadas', 'urls_imagenes', 'rutas_descargadas']
            
            with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(csv_data)
            
            print(f"✅ CSV guardado con {len(csv_data)} filas")
        else:
            print("⚠️  No hay datos para guardar en CSV")
    
    def extract_price(self, product_name: str) -> str:
        """Extrae el precio del nombre del producto"""
        import re
        # Buscar patrones como MXN $480.00 o $480
        price_match = re.search(r'(MXN \$[\d,]+\.?\d*|\$[\d,]+\.?\d*)', product_name)
        return price_match.group(1) if price_match else ''

def main():
    parser = argparse.ArgumentParser(description='Scraper para Estudio Artesana')
    parser.add_argument('--dry-run', action='store_true', help='Ejecutar en modo dry-run (no descargar)')
    parser.add_argument('--max-products', type=int, default=5, help='Máximo número de productos (default: 5)')
    parser.add_argument('--delay', type=float, default=1.0, help='Delay entre requests en segundos')
    parser.add_argument('--base-url', default='http://estudioartesana.local', help='URL base del sitio')
    
    args = parser.parse_args()
    
    scraper = ArtesanaScraper(base_url=args.base_url, delay=args.delay)
    results = scraper.scrape_products(dry_run=args.dry_run, max_products=args.max_products)
    
    # Mostrar resumen
    print("\n" + "="*50)
    print("📊 RESUMEN DE SCRAPING")
    print("="*50)
    print(f"📂 Categorías encontradas: {len(results['categories'])}")
    print(f"📦 Total productos: {results['total_products']}")
    print(f"🖼️  Total imágenes: {results['total_images']}")
    print(f"❌ Errores: {len(results['errors'])}")
    
    # Mostrar detalle de productos
    for category in results['categories']:
        print(f"\n📂 {category['name']}: {len(category['products'])} productos")
        for product in category['products']:
            print(f"  📦 {product['name']}")
            variant_names = list(product['variants'].keys())
            total_images = sum(len(images) for images in product['variants'].values())
            print(f"     🎨 Variantes: {', '.join(variant_names)}")
            print(f"     🖼️  Imágenes totales: {total_images}")
            if not args.dry_run:
                print(f"     ⬇️  Descargadas: {len(product['downloaded_images'])}")
    
    # Guardar reportes
    json_report = "scraper/scraping_report.json"
    csv_report = "scraper/productos_scrapeados.csv"
    
    # Crear directorio scraper si no existe
    Path("scraper").mkdir(exist_ok=True)
    
    # Guardar reporte JSON
    with open(json_report, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    # Guardar reporte CSV
    scraper.save_csv_report(results, csv_report)
    
    print(f"\n📄 Reportes guardados en:")
    print(f"   📊 JSON: {json_report}")
    print(f"   📈 CSV: {csv_report}")

if __name__ == "__main__":
    main()
