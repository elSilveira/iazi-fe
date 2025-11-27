"use client";

import { useState, Suspense, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  MapPin,
  Star,
  Clock,
  Filter,
  X,
  ChevronRight,
  Briefcase,
  TrendingUp,
  History,
  ChevronLeft,
  Grid,
  List,
  DollarSign,
  Calendar,
  Scissors,
  User,
} from "lucide-react";
import { fetchProfessionals, fetchCategories, fetchServices } from "@/lib/api";
import Link from "next/link";

interface Professional {
  id: string;
  userId: string;
  companyId?: string;
  bio?: string;
  jobTitle?: string;
  name?: string;
  image?: string;
  rating?: number;
  totalReviews?: number;
  reviewCount?: number;
  isActive?: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  company?: {
    id: string;
    name: string;
  } | null;
  services?: Array<{
    professionalId?: string;
    serviceId?: string;
    price?: string | number | null;
    service?: {
      id: string;
      name: string;
      description?: string;
      duration?: string;
      price?: string | number;
      image?: string;
      category?: {
        id: number;
        name: string;
        icon?: string;
      };
    };
    id?: string;
    name?: string;
    duration?: string;
  }>;
}

interface Category {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  categoryId: string;
  price?: number;
}

interface ExtractedService {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  price?: string | number;
  image?: string;
  category?: {
    id: number;
    name: string;
    icon?: string;
  };
  professional: {
    id: string;
    name: string;
    image?: string;
    rating?: number;
  };
  // Track all professionals offering this service
  allProfessionals: Array<{
    id: string;
    name: string;
    image?: string;
    rating?: number;
  }>;
}

type ViewTab = "all" | "professionals" | "services";

// Recent searches storage key
const RECENT_SEARCHES_KEY = "iazi_recent_searches";
const MAX_RECENT_SEARCHES = 5;

// Featured categories for discovery
const featuredCategories = [
  { id: "beauty", name: "Beleza", icon: "💅", color: "bg-pink-100 text-pink-700" },
  { id: "health", name: "Saúde", icon: "🏥", color: "bg-green-100 text-green-700" },
  { id: "fitness", name: "Fitness", icon: "💪", color: "bg-blue-100 text-blue-700" },
  { id: "education", name: "Educação", icon: "📚", color: "bg-yellow-100 text-yellow-700" },
  { id: "tech", name: "Tecnologia", icon: "💻", color: "bg-purple-100 text-purple-700" },
  { id: "home", name: "Casa", icon: "🏠", color: "bg-orange-100 text-orange-700" },
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedService, setSelectedService] = useState(searchParams.get("service") || "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "rating_desc");
  const [showFilters, setShowFilters] = useState(false);
  
  // New filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [availableToday, setAvailableToday] = useState(false);
  const [availableThisWeek, setAvailableThisWeek] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [viewTab, setViewTab] = useState<ViewTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const itemsPerPage = 12;

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }
  };

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const categories: Category[] = categoriesData || [];

  // Fetch services (filtered by category if selected)
  const { data: servicesData } = useQuery({
    queryKey: ["services", selectedCategory],
    queryFn: () => fetchServices(selectedCategory ? { categoryId: selectedCategory } : {}),
  });
  const services: Service[] = servicesData?.data || servicesData || [];

  // Fetch professionals with filters
  const { data: professionalsData, isLoading } = useQuery({
    queryKey: ["professionals", searchQuery, selectedCategory, selectedService, minRating, sortBy, priceRange, availableToday, availableThisWeek, currentPage],
    queryFn: () =>
      fetchProfessionals({
        q: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        serviceId: selectedService || undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 500 ? priceRange[1] : undefined,
        availableToday: availableToday || undefined,
        availableThisWeek: availableThisWeek || undefined,
        sort: sortBy || undefined,
        include: "user,company,services",
        page: currentPage,
        limit: itemsPerPage,
      }),
  });

  const professionals: Professional[] = professionalsData?.data || professionalsData || [];
  const totalPages = professionalsData?.pagination?.totalPages || professionalsData?.meta?.totalPages || Math.ceil(professionals.length / itemsPerPage) || 1;
  const totalCount = professionalsData?.pagination?.totalItems || professionalsData?.meta?.total || professionals.length;

  // Extract services from professionals - group by service ID and collect all professionals
  const extractedServices = useMemo<ExtractedService[]>(() => {
    // First pass: collect all professionals per service
    const servicesProfessionalsMap = new Map<string, {
      service: {
        id: string;
        name: string;
        description?: string;
        duration?: string;
        price?: string | number;
        image?: string;
        category?: { id: number; name: string; icon?: string; };
      };
      professionals: Array<{
        id: string;
        name: string;
        image?: string;
        rating?: number;
      }>;
    }>();
    
    professionals.forEach((professional) => {
      if (professional.services && Array.isArray(professional.services)) {
        professional.services.forEach((svc) => {
          const service = svc.service;
          const serviceId = svc.serviceId || service?.id || svc.id;
          
          if (serviceId) {
            const professionalInfo = {
              id: professional.id,
              name: professional.name || professional.user?.name || "Profissional",
              image: professional.image || professional.user?.avatarUrl,
              rating: professional.rating,
            };

            if (servicesProfessionalsMap.has(serviceId)) {
              // Add professional to existing service
              const existing = servicesProfessionalsMap.get(serviceId)!;
              // Check if professional is already added
              if (!existing.professionals.some(p => p.id === professional.id)) {
                existing.professionals.push(professionalInfo);
              }
            } else {
              // Create new service entry
              servicesProfessionalsMap.set(serviceId, {
                service: {
                  id: serviceId,
                  name: service?.name || svc.name || "Serviço",
                  description: service?.description,
                  duration: service?.duration || svc.duration,
                  price: svc.price ?? service?.price,
                  image: service?.image,
                  category: service?.category,
                },
                professionals: [professionalInfo],
              });
            }
          }
        });
      }
    });
    
    // Convert to ExtractedService array
    return Array.from(servicesProfessionalsMap.values()).map(({ service, professionals: profs }) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      image: service.image,
      category: service.category,
      professional: profs[0], // Primary professional (first one found)
      allProfessionals: profs, // All professionals offering this service
    }));
  }, [professionals]);

  const handleSearch = () => {
    if (searchQuery) {
      saveRecentSearch(searchQuery);
    }
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedService) params.set("service", selectedService);
    if (minRating) params.set("minRating", minRating);
    if (sortBy) params.set("sort", sortBy);
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedService("");
    setMinRating("");
    setSortBy("rating_desc");
    setPriceRange([0, 500]);
    setAvailableToday(false);
    setAvailableThisWeek(false);
    setCurrentPage(1);
    router.push("/search");
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    saveRecentSearch(query);
    handleSearch();
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedService || minRating || priceRange[0] > 0 || priceRange[1] < 500 || availableToday || availableThisWeek;

  const getInitials = (name?: string) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Navigation />
      <main className="container mx-auto py-8 px-4 mt-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Encontre Profissionais</h1>
          <p className="text-muted-foreground">
            Busque e agende serviços com os melhores profissionais da sua região
          </p>
        </div>

        {/* Featured Categories */}
        {!hasActiveFilters && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Categorias em Destaque
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {featuredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    handleSearch();
                  }}
                  className={`p-4 rounded-lg ${cat.color} hover:opacity-80 transition-opacity text-center`}
                >
                  <span className="text-2xl block mb-1">{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {!hasActiveFilters && recentSearches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                Buscas Recentes
              </h2>
              <Button variant="ghost" size="sm" onClick={clearRecentSearches} className="text-xs">
                Limpar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((query, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent px-3 py-1"
                  onClick={() => handleRecentSearchClick(query)}
                >
                  {query}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, serviço ou especialidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-accent" : ""}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-accent" : ""}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`w-full lg:w-72 space-y-6 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filtros</CardTitle>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Serviço</label>
                  <Select value={selectedService || "all"} onValueChange={(value) => setSelectedService(value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os serviços" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os serviços</SelectItem>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Avaliação Mínima</label>
                  <Select value={minRating || "all"} onValueChange={(value) => setMinRating(value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer avaliação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer avaliação</SelectItem>
                      <SelectItem value="4.5">4.5+ ⭐</SelectItem>
                      <SelectItem value="4">4+ ⭐</SelectItem>
                      <SelectItem value="3.5">3.5+ ⭐</SelectItem>
                      <SelectItem value="3">3+ ⭐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Faixa de Preço
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    min={0}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>R$ {priceRange[0]}</span>
                    <span>R$ {priceRange[1]}+</span>
                  </div>
                </div>

                {/* Availability Filters */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Disponibilidade
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="availableToday"
                        checked={availableToday}
                        onCheckedChange={(checked) => setAvailableToday(checked === true)}
                      />
                      <Label htmlFor="availableToday" className="text-sm cursor-pointer">
                        Disponível hoje
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="availableThisWeek"
                        checked={availableThisWeek}
                        onCheckedChange={(checked) => setAvailableThisWeek(checked === true)}
                      />
                      <Label htmlFor="availableThisWeek" className="text-sm cursor-pointer">
                        Disponível esta semana
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ordenar por</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating_desc">Melhor Avaliação</SelectItem>
                      <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                      <SelectItem value="reviewCount_desc">Mais Avaliados</SelectItem>
                      <SelectItem value="price_asc">Menor Preço</SelectItem>
                      <SelectItem value="price_desc">Maior Preço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSearch} className="w-full">
                  Aplicar Filtros
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* View Tabs */}
            <Tabs value={viewTab} onValueChange={(value) => setViewTab(value as ViewTab)} className="mb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <TabsList>
                  <TabsTrigger value="all" className="gap-2">
                    <Grid className="h-4 w-4" />
                    Todos
                  </TabsTrigger>
                  <TabsTrigger value="professionals" className="gap-2">
                    <User className="h-4 w-4" />
                    Profissionais ({professionals.length})
                  </TabsTrigger>
                  <TabsTrigger value="services" className="gap-2">
                    <Scissors className="h-4 w-4" />
                    Serviços ({extractedServices.length})
                  </TabsTrigger>
                </TabsList>
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? "Buscando..."
                    : viewTab === "services" 
                      ? `${extractedServices.length} serviço(s) encontrado(s)`
                      : viewTab === "professionals"
                        ? `${professionals.length} profissional(is) encontrado(s)`
                        : `${professionals.length} profissional(is) e ${extractedServices.length} serviço(s)`}
                </p>
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className={`grid gap-4 mt-4 ${viewMode === "grid" ? "md:grid-cols-2" : "grid-cols-1"}`}>
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <Skeleton className="h-16 w-16 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : professionals.length === 0 && extractedServices.length === 0 ? (
                <Card className="mt-4">
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Nenhum resultado encontrado
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Tente ajustar os filtros ou buscar por outro termo
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Limpar Filtros
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* All Tab Content */}
                  <TabsContent value="all" className="mt-4 space-y-8">
                    {/* Professionals Section */}
                    {professionals.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Profissionais
                          </h3>
                          {professionals.length > 4 && (
                            <Button variant="ghost" size="sm" onClick={() => setViewTab("professionals")}>
                              Ver todos ({professionals.length})
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        </div>
                        <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2" : "grid-cols-1"}`}>
                          {professionals.slice(0, 4).map((professional) => (
                            <ProfessionalCard 
                              key={professional.id} 
                              professional={professional} 
                              viewMode={viewMode}
                              router={router}
                              getInitials={getInitials}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Services Section */}
                    {extractedServices.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Scissors className="h-5 w-5 text-primary" />
                            Serviços
                          </h3>
                          {extractedServices.length > 4 && (
                            <Button variant="ghost" size="sm" onClick={() => setViewTab("services")}>
                              Ver todos ({extractedServices.length})
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        </div>
                        <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2" : "grid-cols-1"}`}>
                          {extractedServices.slice(0, 4).map((service) => (
                            <ServiceCard 
                              key={service.id} 
                              service={service} 
                              viewMode={viewMode}
                              router={router}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Professionals Tab Content */}
                  <TabsContent value="professionals" className="mt-4">
                    {professionals.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">
                            Nenhum profissional encontrado
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            Tente ajustar os filtros ou buscar por outro termo
                          </p>
                          <Button variant="outline" onClick={clearFilters}>
                            Limpar Filtros
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2" : "grid-cols-1"}`}>
                          {professionals.map((professional) => (
                            <ProfessionalCard 
                              key={professional.id} 
                              professional={professional} 
                              viewMode={viewMode}
                              router={router}
                              getInitials={getInitials}
                            />
                          ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-8">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Anterior
                            </Button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage - 2 + i;
                                }
                                return (
                                  <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {pageNum}
                                  </Button>
                                );
                              })}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Próximo
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* Services Tab Content */}
                  <TabsContent value="services" className="mt-4">
                    {extractedServices.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">
                            Nenhum serviço encontrado
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            Tente ajustar os filtros ou buscar por outro termo
                          </p>
                          <Button variant="outline" onClick={clearFilters}>
                            Limpar Filtros
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2" : "grid-cols-1"}`}>
                        {extractedServices.map((service) => (
                          <ServiceCard 
                            key={service.id} 
                            service={service} 
                            viewMode={viewMode}
                            router={router}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </div>
      </main>
    </>
  );
}

// Professional Card Component
function ProfessionalCard({ 
  professional, 
  viewMode, 
  router, 
  getInitials 
}: { 
  professional: Professional; 
  viewMode: "grid" | "list";
  router: ReturnType<typeof useRouter>;
  getInitials: (name?: string) => string;
}) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/professional/${professional.id}`)}
    >
      <CardContent className={viewMode === "list" ? "p-4" : "p-6"}>
        <div className={`flex gap-4 ${viewMode === "list" ? "items-center" : ""}`}>
          <Avatar className={viewMode === "list" ? "h-12 w-12" : "h-16 w-16"}>
            <AvatarImage src={professional.image || professional.user?.avatarUrl} />
            <AvatarFallback className={viewMode === "list" ? "text-base" : "text-lg"}>
              {getInitials(professional.name || professional.user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold truncate">
                  {professional.name || professional.user?.name || "Profissional"}
                </h3>
                {professional.jobTitle && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {professional.jobTitle}
                  </p>
                )}
                {professional.bio && !professional.jobTitle && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {professional.bio}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Price indicator */}
                {professional.services && professional.services.length > 0 && (
                  <span className="text-sm font-medium text-primary">
                    A partir de R$ {Math.min(...professional.services.map(s => {
                      const price = s.price ?? s.service?.price;
                      return typeof price === 'string' ? parseFloat(price) || 0 : (price || 0);
                    }))}
                  </span>
                )}
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </div>

            {/* Rating */}
            {professional.rating !== undefined && professional.rating > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">
                  {professional.rating.toFixed(1)}
                </span>
                {(professional.reviewCount !== undefined || professional.totalReviews !== undefined) && (
                  <span className="text-sm text-muted-foreground">
                    ({professional.reviewCount || professional.totalReviews} avaliações)
                  </span>
                )}
              </div>
            )}

            {/* Company */}
            {professional.company && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {professional.company.name}
              </p>
            )}

            {/* Services */}
            {professional.services && professional.services.length > 0 && viewMode === "grid" && (
              <div className="flex flex-wrap gap-1 mt-2">
                {professional.services.slice(0, 3).map((svc, index) => (
                  <Badge key={svc.serviceId || svc.service?.id || svc.id || `service-${index}`} variant="secondary" className="text-xs">
                    {svc.service?.name || svc.name}
                  </Badge>
                ))}
                {professional.services.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{professional.services.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Service Card Component
function ServiceCard({ 
  service, 
  viewMode, 
  router 
}: { 
  service: ExtractedService; 
  viewMode: "grid" | "list";
  router: ReturnType<typeof useRouter>;
}) {
  const formatPrice = (price?: string | number) => {
    if (price === null || price === undefined) return null;
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? null : numPrice;
  };

  const priceValue = formatPrice(service.price);
  const hasSingleProfessional = service.allProfessionals.length === 1;
  const professionalsCount = service.allProfessionals.length;

  const handleClick = () => {
    if (hasSingleProfessional) {
      // Go directly to booking page if only one professional
      router.push(`/booking/${service.professional.id}?serviceId=${service.id}`);
    } else {
      // Go to service details page to choose professional
      router.push(`/service/${service.id}`);
    }
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      <CardContent className={viewMode === "list" ? "p-4" : "p-0"}>
        {viewMode === "grid" && service.image && (
          <div className="relative h-32 w-full">
            <img 
              src={service.image} 
              alt={service.name}
              className="w-full h-full object-cover"
            />
            {service.category && (
              <Badge className="absolute top-2 left-2" variant="secondary">
                {service.category.name}
              </Badge>
            )}
            {/* Show professionals count badge if more than one */}
            {professionalsCount > 1 && (
              <Badge className="absolute top-2 right-2" variant="default">
                {professionalsCount} profissionais
              </Badge>
            )}
          </div>
        )}
        <div className={viewMode === "grid" ? "p-4" : "flex gap-4 items-center"}>
          {viewMode === "list" && service.image && (
            <div className="relative h-16 w-16 rounded-md overflow-hidden shrink-0">
              <img 
                src={service.image} 
                alt={service.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{service.name}</h3>
                {service.description && viewMode === "grid" && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {service.description}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                {priceValue !== null && (
                  <span className="text-lg font-bold text-primary">
                    R$ {priceValue}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {service.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {service.duration}
                </span>
              )}
              {service.category && viewMode === "list" && (
                <Badge variant="outline" className="text-xs">
                  {service.category.name}
                </Badge>
              )}
              {/* Show professionals count in list mode */}
              {viewMode === "list" && professionalsCount > 1 && (
                <Badge variant="secondary" className="text-xs">
                  {professionalsCount} profissionais
                </Badge>
              )}
            </div>

            {/* Professional Info - Show differently based on count */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              {hasSingleProfessional ? (
                // Single professional: show their info
                <>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={service.professional.image} />
                    <AvatarFallback className="text-xs">
                      {service.professional.name?.charAt(0) || "P"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground truncate">
                    {service.professional.name}
                  </span>
                  {service.professional.rating !== undefined && service.professional.rating > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{service.professional.rating.toFixed(1)}</span>
                    </div>
                  )}
                </>
              ) : (
                // Multiple professionals: show stacked avatars and count
                <>
                  <div className="flex -space-x-2">
                    {service.allProfessionals.slice(0, 3).map((prof, idx) => (
                      <Avatar key={prof.id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={prof.image} />
                        <AvatarFallback className="text-xs">
                          {prof.name?.charAt(0) || "P"}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {professionalsCount} profissionais disponíveis
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </>
              )}
            </div>
          </div>
          {viewMode === "list" && hasSingleProfessional && (
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SearchLoading() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center mb-8">
            <Skeleton className="h-10 w-96 mb-4" />
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchPageContent />
    </Suspense>
  );
}
