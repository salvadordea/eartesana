'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Heart, Star } from 'lucide-react'

// Types
interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: number
  images: Array<{
    src: string
    alt: string
    localFileName?: string
  }>
  variations: Array<{
    id: string
    name: string
    price: number
    stock: number
  }>
  featured: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  count: number
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // En Next.js, podemos importar datos estáticos directamente
      const productsModule = await import('@/data/products.json')
      const categoriesModule = await import('@/data/categories.json')
      
      setProducts(productsModule.default.filter((p: Product) => p.featured).slice(0, 8))
      setCategories(categoriesModule.default.slice(0, 6))
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price)
  }

  const getImageSrc = (product: Product) => {
    if (product.images && product.images.length > 0) {
      // Si hay imagen local, usarla
      if (product.images[0].localFileName) {
        return `/images/products/${product.images[0].localFileName}`
      }
      // Si no, usar la URL original
      return product.images[0].src
    }
    // Imagen placeholder
    return '/images/placeholder-product.jpg'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos artesanales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-amber-800">Estudio Artesana</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/productos" className="text-gray-700 hover:text-amber-600 font-medium">
                Productos
              </Link>
              <Link href="/categorias" className="text-gray-700 hover:text-amber-600 font-medium">
                Categorías
              </Link>
              <Link href="/contacto" className="text-gray-700 hover:text-amber-600 font-medium">
                Contacto
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-700 hover:text-amber-600">
                <Heart className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-700 hover:text-amber-600 relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-amber-600 to-orange-500 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Artesanías Únicas
            <span className="block text-amber-200">Hechas a Mano</span>
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-amber-100 max-w-3xl mx-auto">
            Descubre productos artesanales auténticos creados con pasión y dedicación. 
            Cada pieza cuenta una historia única.
          </p>
          <div className="space-x-4">
            <Link 
              href="/productos"
              className="bg-white text-amber-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-amber-50 transition-colors inline-block"
            >
              Ver Productos
            </Link>
            <Link 
              href="/categorias"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-amber-600 transition-colors inline-block"
            >
              Explorar Categorías
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Nuestras Categorías</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explora nuestra amplia gama de productos artesanales organizados por categoría
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="group"
              >
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center mx-auto group-hover:bg-amber-300 transition-colors">
                      <span className="text-amber-800 font-semibold">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{category.name}</h4>
                  <p className="text-sm text-gray-600">{category.count} productos</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Productos Destacados</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubre nuestras piezas más populares y recién llegadas
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group">
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:scale-105">
                  <div className="relative h-64 bg-gradient-to-br from-amber-100 to-orange-100">
                    <Image
                      src={getImageSrc(product)}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute top-4 right-4">
                      <button className="bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors">
                        <Heart className="h-4 w-4 text-gray-700" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h4>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-amber-600">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">4.8</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Link
                        href={`/producto/${product.slug}`}
                        className="block w-full bg-amber-600 text-white text-center py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors"
                      >
                        Ver Producto
                      </Link>
                      <button className="w-full border border-amber-600 text-amber-600 py-2 rounded-lg font-medium hover:bg-amber-50 transition-colors">
                        Añadir al Carrito
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/productos"
              className="inline-flex items-center bg-amber-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-amber-700 transition-colors"
            >
              Ver Todos los Productos
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xl font-bold text-amber-400 mb-4">Estudio Artesana</h4>
              <p className="text-gray-300 mb-4">
                Creando productos artesanales únicos con pasión y dedicación desde el corazón de México.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Enlaces</h5>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/productos" className="hover:text-amber-400">Productos</Link></li>
                <li><Link href="/categorias" className="hover:text-amber-400">Categorías</Link></li>
                <li><Link href="/contacto" className="hover:text-amber-400">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Categorías</h5>
              <ul className="space-y-2 text-gray-300">
                {categories.slice(0, 4).map((category) => (
                  <li key={category.id}>
                    <Link href={`/categoria/${category.slug}`} className="hover:text-amber-400">
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Contacto</h5>
              <div className="text-gray-300 space-y-2">
                <p>contacto@estudioartesana.com</p>
                <p>+52 1 234 567 8900</p>
                <div className="flex space-x-4 mt-4">
                  <a href="#" className="text-gray-300 hover:text-amber-400">Instagram</a>
                  <a href="#" className="text-gray-300 hover:text-amber-400">Facebook</a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Estudio Artesana. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
