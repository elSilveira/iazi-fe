"use client";

import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { 
  Scissors, 
  Sparkles, 
  Heart, 
  Dumbbell,
  ChevronRight,
  Star,
  MapPin,
  Clock
} from "lucide-react";

const categories = [
  { id: 1, name: "Cabelo", icon: Scissors, color: "bg-pink-100 text-pink-600" },
  { id: 2, name: "Estética", icon: Sparkles, color: "bg-purple-100 text-purple-600" },
  { id: 3, name: "Bem-estar", icon: Heart, color: "bg-red-100 text-red-600" },
  { id: 4, name: "Fitness", icon: Dumbbell, color: "bg-blue-100 text-blue-600" },
];

const featuredServices = [
  {
    id: 1,
    name: "Corte Feminino",
    professional: "Maria Silva",
    rating: 4.9,
    reviews: 128,
    price: "R$ 80,00",
    duration: "45 min",
  },
  {
    id: 2,
    name: "Manicure e Pedicure",
    professional: "Ana Santos",
    rating: 4.8,
    reviews: 96,
    price: "R$ 60,00",
    duration: "60 min",
  },
  {
    id: 3,
    name: "Massagem Relaxante",
    professional: "Carlos Lima",
    rating: 5.0,
    reviews: 75,
    price: "R$ 120,00",
    duration: "90 min",
  },
];

const featuredProfessionals = [
  {
    id: 1,
    name: "Maria Silva",
    specialty: "Cabeleireira",
    rating: 4.9,
    reviews: 256,
    location: "São Paulo, SP",
  },
  {
    id: 2,
    name: "João Santos",
    specialty: "Barbeiro",
    rating: 4.8,
    reviews: 189,
    location: "Rio de Janeiro, RJ",
  },
  {
    id: 3,
    name: "Ana Costa",
    specialty: "Esteticista",
    rating: 4.9,
    reviews: 312,
    location: "Belo Horizonte, MG",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F4F3F2]">
      <Navigation />

      <main className="container mx-auto px-4 pt-8 pb-12">
        {/* Hero Section */}
        <section className="text-center py-12 md:py-16">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-foreground" style={{ fontFamily: 'var(--font-playfair)' }}>
            Encontre os melhores profissionais e serviços
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Agende serviços de beleza, bem-estar e muito mais com os melhores profissionais da sua região.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" className="w-full sm:w-auto">
                Explorar Serviços
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Cadastrar como Profissional
              </Button>
            </Link>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
              Categorias
            </h2>
            <Link href="/search" className="text-primary hover:underline flex items-center text-sm">
              Ver todas <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/search?category=${category.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className={`p-4 rounded-full mb-3 ${category.color}`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Services */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
              Serviços em Destaque
            </h2>
            <Link href="/services" className="text-primary hover:underline flex items-center text-sm">
              Ver todos <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredServices.map((service) => (
              <Link key={service.id} href={`/service/${service.id}`}>
                <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Scissors className="h-12 w-12 text-primary/40" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{service.professional}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="ml-1 text-sm font-medium text-foreground">{service.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">({service.reviews} avaliações)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">{service.price}</span>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        {service.duration}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Professionals */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
              Profissionais em Destaque
            </h2>
            <Link href="/professionals" className="text-primary hover:underline flex items-center text-sm">
              Ver todos <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredProfessionals.map((professional) => (
              <Link key={professional.id} href={`/professional/${professional.id}`}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{professional.name[0]}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{professional.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{professional.specialty}</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="ml-1 text-sm font-medium text-foreground">{professional.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">({professional.reviews})</span>
                    </div>
                    <div className="flex items-center justify-center text-muted-foreground text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      {professional.location}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 text-center">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
                Seja um profissional iAzi
              </h2>
              <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
                Cadastre-se gratuitamente e comece a receber agendamentos de clientes na sua região.
              </p>
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Começar Agora
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t mt-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-xl text-primary mb-4">iAzi</h3>
              <p className="text-sm text-muted-foreground">
                A plataforma que conecta você aos melhores profissionais de beleza e bem-estar.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Para Clientes</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/search" className="hover:text-primary">Buscar Serviços</Link></li>
                <li><Link href="/professionals" className="hover:text-primary">Profissionais</Link></li>
                <li><Link href="/booking-history" className="hover:text-primary">Meus Agendamentos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Para Profissionais</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/register" className="hover:text-primary">Cadastre-se</Link></li>
                <li><Link href="/profile/professional" className="hover:text-primary">Painel do Profissional</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-primary">Central de Ajuda</Link></li>
                <li><Link href="/terms" className="hover:text-primary">Termos de Uso</Link></li>
                <li><Link href="/privacy" className="hover:text-primary">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} iAzi. Todos os direitos reservados.
          </div>
        </footer>
      </main>
    </div>
  );
}
