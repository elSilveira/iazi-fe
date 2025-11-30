"use client";

import { useState, Suspense, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Grid,
  List,
  DollarSign,
  Calendar,
  Scissors,
  User,
  Building2,
  Users,
  Phone,
  Globe,
  Award,
  Expand,
} from "lucide-react";
import { 
  fetchCategories, 
  fetchSearch,
  type SearchProfessional,
  type SearchService,
  type SearchCompany,
  type SearchProfessionalService,
} from "@/lib/api";

interface Category {
  id: string;
  name: string;
}

type ViewTab = "all" | "professionals" | "services" | "companies";

// Recent searches storage key
const RECENT_SEARCHES_KEY = "iazi_recent_searches";
const MAX_RECENT_SEARCHES = 5;

// Category colors for visual distinction on cards
const categoryColors: Record<string, { border: string; bg: string; text: string }> = {
  // Beauty & Personal Care
  "beleza": { border: "border-l-pink-500", bg: "bg-pink-50", text: "text-pink-700" },
  "cabelo": { border: "border-l-pink-400", bg: "bg-pink-50", text: "text-pink-600" },
  "manicure": { border: "border-l-rose-500", bg: "bg-rose-50", text: "text-rose-700" },
  "maquiagem": { border: "border-l-fuchsia-500", bg: "bg-fuchsia-50", text: "text-fuchsia-700" },
  "estética": { border: "border-l-pink-600", bg: "bg-pink-50", text: "text-pink-800" },
  // Health & Wellness
  "saúde": { border: "border-l-green-500", bg: "bg-green-50", text: "text-green-700" },
  "massagem": { border: "border-l-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  "terapia": { border: "border-l-teal-500", bg: "bg-teal-50", text: "text-teal-700" },
  "bem-estar": { border: "border-l-green-400", bg: "bg-green-50", text: "text-green-600" },
  // Fitness & Sports
  "fitness": { border: "border-l-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  "personal": { border: "border-l-blue-600", bg: "bg-blue-50", text: "text-blue-800" },
  "esportes": { border: "border-l-sky-500", bg: "bg-sky-50", text: "text-sky-700" },
  // Education
  "educação": { border: "border-l-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700" },
  "aulas": { border: "border-l-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  // Technology
  "tecnologia": { border: "border-l-purple-500", bg: "bg-purple-50", text: "text-purple-700" },
  "ti": { border: "border-l-violet-500", bg: "bg-violet-50", text: "text-violet-700" },
  // Home & Services
  "casa": { border: "border-l-orange-500", bg: "bg-orange-50", text: "text-orange-700" },
  "limpeza": { border: "border-l-orange-400", bg: "bg-orange-50", text: "text-orange-600" },
  "manutenção": { border: "border-l-amber-600", bg: "bg-amber-50", text: "text-amber-800" },
  // Barber
  "barbearia": { border: "border-l-slate-600", bg: "bg-slate-50", text: "text-slate-700" },
  "barba": { border: "border-l-slate-500", bg: "bg-slate-50", text: "text-slate-600" },
  // Default
  "default": { border: "border-l-gray-400", bg: "bg-gray-50", text: "text-gray-600" },
};

// Get category color based on category name
const getCategoryColor = (categoryName?: string) => {
  if (!categoryName) return categoryColors.default;
  const key = categoryName.toLowerCase().trim();
  // Try exact match first
  if (categoryColors[key]) return categoryColors[key];
  // Try partial match
  for (const [colorKey, colors] of Object.entries(categoryColors)) {
    if (key.includes(colorKey) || colorKey.includes(key)) {
      return colors;
    }
  }
  return categoryColors.default;
};

// Entity type colors - distinct colors for each card type
const entityTypeColors = {
  professional: {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  service: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  company: {
    border: "border-l-violet-500",
    bg: "bg-violet-50",
    text: "text-violet-700",
    badge: "bg-violet-100 text-violet-700 border-violet-200",
  },
};

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
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");
  const [sortBy, setSortBy] = useState<"name" | "rating">(
    (searchParams.get("sort") as "name" | "rating") || "rating"
  );
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [availableToday, setAvailableToday] = useState(false);
  const [availableThisWeek, setAvailableThisWeek] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [viewTab, setViewTab] = useState<ViewTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const itemsPerPage = 20;

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

  // Fetch categories for filter dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const categories: Category[] = categoriesData || [];

  // Use unified search API - single request for all data
  const { data: searchData, isLoading } = useQuery({
    queryKey: ["search", searchQuery, selectedCategory, sortBy, currentPage, itemsPerPage],
    queryFn: () =>
      fetchSearch({
        q: searchQuery || undefined,
        category: selectedCategory || undefined,
        sort: sortBy,
        page: currentPage,
        limit: itemsPerPage,
      }),
  });

  // Extract data from unified search response
  const professionals: SearchProfessional[] = searchData?.professionals || [];
  const professionalServices: SearchProfessionalService[] = searchData?.professional_services || [];
  const companies: SearchCompany[] = searchData?.companies || [];

  // Client-side filtering for rating and price (if API doesn't support)
  const filteredProfessionals = professionals.filter(p => {
    if (minRating && (p.rating || 0) < parseFloat(minRating)) return false;
    return true;
  });

  const filteredServices = professionalServices.filter(s => {
    if (!s.price) return true;
    const price = typeof s.price === 'number' ? s.price : parseFloat(String(s.price));
    if (priceRange[0] > 0 && price < priceRange[0]) return false;
    if (priceRange[1] < 500 && price > priceRange[1]) return false;
    return true;
  });

  // Group services by name for aggregated view
  interface GroupedService {
    name: string;
    category: { id: number; name: string } | null;
    image: string | undefined;
    description: string;
    minPrice: number;
    maxPrice: number;
    minDuration: number; // in minutes
    maxDuration: number; // in minutes
    minRating: number;
    maxRating: number;
    professionals: Array<{
      id: string;
      name: string;
      image: string | null;
      rating: number;
      price: number;
      duration: number; // in minutes
      serviceId: string;
    }>;
  }

  // Helper to parse duration to minutes
  const parseDurationToMinutes = (duration: string | undefined): number => {
    if (!duration) return 0;
    const str = String(duration).toLowerCase().trim();
    
    // Already in minutes (e.g., "30", "45")
    const justNumber = parseInt(str);
    if (!isNaN(justNumber) && !str.includes("h")) {
      return justNumber;
    }
    
    // Format like "2h", "1h30min", "30min"
    let totalMinutes = 0;
    const hoursMatch = str.match(/(\d+)\s*h/);
    const minsMatch = str.match(/(\d+)\s*min/);
    
    if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
    if (minsMatch) totalMinutes += parseInt(minsMatch[1]);
    
    // If only has number, treat as minutes
    if (!hoursMatch && !minsMatch && !isNaN(justNumber)) {
      return justNumber;
    }
    
    return totalMinutes || 0;
  };

  const groupedServices = useMemo(() => {
    const groups: Record<string, GroupedService> = {};
    
    filteredServices.forEach(service => {
      const key = service.name.toLowerCase().trim();
      const price = typeof service.price === 'number' ? service.price : parseFloat(String(service.price)) || 0;
      const durationMinutes = parseDurationToMinutes(service.duration);
      const rating = service.profissional?.rating || 0;
      
      if (!groups[key]) {
        groups[key] = {
          name: service.name,
          category: service.category,
          image: service.image,
          description: service.description,
          minPrice: price,
          maxPrice: price,
          minDuration: durationMinutes,
          maxDuration: durationMinutes,
          minRating: rating > 0 ? rating : Infinity,
          maxRating: rating,
          professionals: [],
        };
      }
      
      // Update price range
      if (price > 0 && price < groups[key].minPrice) groups[key].minPrice = price;
      if (price > groups[key].maxPrice) groups[key].maxPrice = price;
      
      // Update duration range
      if (durationMinutes > 0 && durationMinutes < groups[key].minDuration) groups[key].minDuration = durationMinutes;
      if (durationMinutes > groups[key].maxDuration) groups[key].maxDuration = durationMinutes;
      
      // Update rating range
      if (rating > 0 && rating < groups[key].minRating) groups[key].minRating = rating;
      if (rating > groups[key].maxRating) groups[key].maxRating = rating;
      
      // Add professional
      if (service.profissional) {
        groups[key].professionals.push({
          id: service.profissional.id,
          name: service.profissional.name,
          image: service.profissional.image,
          rating: service.profissional.rating,
          price: price,
          duration: durationMinutes,
          serviceId: service.id,
        });
      }
    });
    
    // Fix minRating if still Infinity (no ratings)
    Object.values(groups).forEach(g => {
      if (g.minRating === Infinity) g.minRating = 0;
    });
    
    // Sort by number of professionals (most popular first)
    return Object.values(groups).sort((a, b) => b.professionals.length - a.professionals.length);
  }, [filteredServices]);

  // Count results
  const professionalsCount = filteredProfessionals.length;
  const servicesCount = filteredServices.length;
  const groupedServicesCount = groupedServices.length;
  const companiesCount = companies.length;
  const totalCount = professionalsCount + servicesCount + companiesCount;

  const handleSearch = () => {
    if (searchQuery) {
      saveRecentSearch(searchQuery);
    }
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    if (minRating) params.set("minRating", minRating);
    if (sortBy) params.set("sort", sortBy);
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setMinRating("");
    setSortBy("rating");
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
    setTimeout(() => handleSearch(), 0);
  };

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setCurrentPage(1);
    const params = new URLSearchParams();
    params.set("category", categoryName);
    router.push(`/search?${params.toString()}`);
  };

  const hasActiveFilters = searchQuery || selectedCategory || minRating || priceRange[0] > 0 || priceRange[1] < 500 || availableToday || availableThisWeek;

  const getInitials = (name?: string) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDuration = (duration: number | string | undefined) => {
    if (!duration) return "N/A";
    
    // Se for número, converte para formato legível
    if (typeof duration === "number") {
      const hours = Math.floor(duration / 60);
      const mins = duration % 60;
      if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
      if (hours > 0) return `${hours}h`;
      return `${mins}min`;
    }
    
    // Se for string, verifica se já está formatada (ex: "2h", "30min", "1h 30min")
    const str = String(duration).toLowerCase().trim();
    
    // Se já contém 'h' ou 'min', retorna como está (já formatado)
    if (str.includes("h") || str.includes("min")) {
      return duration;
    }
    
    // Se for apenas número como string, converte
    const minutes = parseInt(str);
    if (!isNaN(minutes)) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
      if (hours > 0) return `${hours}h`;
      return `${mins}min`;
    }
    
    return "N/A";
  };

  return (
    <>
      <Navigation />
      <main className="container mx-auto py-8 px-4 mt-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explorar</h1>
          <p className="text-muted-foreground">
            Encontre profissionais, serviços e empresas na sua região
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
                  onClick={() => handleCategoryClick(cat.name)}
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
              <div className="p-4 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Filtros</h3>
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
              </div>
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
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
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
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as "name" | "rating")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Melhor Avaliação</SelectItem>
                      <SelectItem value="name">Nome (A-Z)</SelectItem>
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
                    Profissionais ({professionalsCount})
                  </TabsTrigger>
                  <TabsTrigger value="services" className="gap-2">
                    <Scissors className="h-4 w-4" />
                    Serviços ({groupedServicesCount})
                  </TabsTrigger>
                  <TabsTrigger value="companies" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    Empresas ({companiesCount})
                  </TabsTrigger>
                </TabsList>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Buscando..." : `${totalCount} resultado(s) encontrado(s)`}
                </p>
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className={`grid gap-4 mt-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                  {[...Array(6)].map((_, i) => (
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
              ) : totalCount === 0 ? (
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
                    {professionalsCount > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Profissionais
                          </h3>
                          {professionalsCount > 3 && (
                            <Button variant="ghost" size="sm" onClick={() => setViewTab("professionals")}>
                              Ver todos ({professionalsCount})
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        </div>
                        <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                          {filteredProfessionals.slice(0, 3).map((professional) => (
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
                    {groupedServicesCount > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Scissors className="h-5 w-5 text-primary" />
                            Serviços
                            <span className="text-sm font-normal text-muted-foreground">
                              ({servicesCount} ofertas)
                            </span>
                          </h3>
                          {groupedServicesCount > 3 && (
                            <Button variant="ghost" size="sm" onClick={() => setViewTab("services")}>
                              Ver todos ({groupedServicesCount})
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        </div>
                        <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                          {groupedServices.slice(0, 3).map((groupedService) => (
                            <GroupedServiceCard 
                              key={groupedService.name} 
                              groupedService={groupedService} 
                              viewMode={viewMode}
                              router={router}
                              formatDuration={formatDuration}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Companies Section */}
                    {companiesCount > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Empresas
                          </h3>
                          {companiesCount > 3 && (
                            <Button variant="ghost" size="sm" onClick={() => setViewTab("companies")}>
                              Ver todas ({companiesCount})
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        </div>
                        <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                          {companies.slice(0, 3).map((company) => (
                            <CompanyCard 
                              key={company.id} 
                              company={company} 
                              viewMode={viewMode}
                              router={router}
                              getInitials={getInitials}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Professionals Tab Content */}
                  <TabsContent value="professionals" className="mt-4">
                    {professionalsCount === 0 ? (
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
                      <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                        {filteredProfessionals.map((professional) => (
                            <ProfessionalCard 
                              key={professional.id} 
                              professional={professional} 
                              viewMode={viewMode}
                              router={router}
                              getInitials={getInitials}
                            />
                          ))}
                        </div>
                    )}
                  </TabsContent>

                  {/* Services Tab Content */}
                  <TabsContent value="services" className="mt-4">
                    {groupedServicesCount === 0 ? (
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
                      <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                        {groupedServices.map((groupedService) => (
                          <GroupedServiceCard 
                            key={groupedService.name} 
                            groupedService={groupedService} 
                            viewMode={viewMode}
                            router={router}
                            formatDuration={formatDuration}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Companies Tab Content */}
                  <TabsContent value="companies" className="mt-4">
                    {companiesCount === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">
                            Nenhuma empresa encontrada
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
                      <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                        {companies.map((company) => (
                          <CompanyCard 
                            key={company.id} 
                            company={company} 
                            viewMode={viewMode}
                            router={router}
                            getInitials={getInitials}
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
  professional: SearchProfessional; 
  viewMode: "grid" | "list";
  router: ReturnType<typeof useRouter>;
  getInitials: (name?: string) => string;
}) {
  // Calculate minimum price from services
  const minPrice = professional.services && professional.services.length > 0
    ? Math.min(...professional.services.map(s => parseFloat(s.price) || 0))
    : null;

  // Use entity type color for professionals (blue)
  const typeColor = entityTypeColors.professional;

  return (
    <Card
      className={`hover:shadow-lg transition-all cursor-pointer border-l-4 ${typeColor.border} h-full`}
      onClick={() => router.push(`/professional/${professional.id}`)}
    >
      <CardContent className="p-4">
        {/* Header row with avatar, name and arrow */}
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={professional.image || undefined} />
            <AvatarFallback className={`text-sm ${typeColor.bg} ${typeColor.text}`}>
              {getInitials(professional.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-base truncate">
                {professional.name || "Profissional"}
              </h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
            
            {professional.role && (
              <p className="text-sm text-muted-foreground truncate">
                {professional.role}
              </p>
            )}
          </div>
        </div>

        {/* Info row: rating, company, price */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-3 min-w-0">
            {/* Rating */}
            {professional.rating > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{professional.rating.toFixed(1)}</span>
              </div>
            )}
            
            {/* Company */}
            {professional.company && (
              <span className="text-sm text-muted-foreground truncate">
                {professional.company.name}
              </span>
            )}
          </div>
          
          {/* Price */}
          {minPrice !== null && minPrice > 0 && (
            <span className="text-sm font-semibold text-primary shrink-0">
              R$ {minPrice.toFixed(0)}+
            </span>
          )}
        </div>

        {/* Services tags - only show if we have space */}
        {professional.services && professional.services.length > 0 && viewMode === "grid" && (
          <div className="flex items-center gap-1.5 mt-3 overflow-hidden">
            {professional.services.slice(0, 2).map((svc) => (
              <Badge key={svc.id} variant="secondary" className="text-xs shrink-0 max-w-[80px] truncate">
                {svc.name}
              </Badge>
            ))}
            {professional.services.length > 2 && (
              <span className="text-xs text-muted-foreground shrink-0">
                +{professional.services.length - 2}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Service Card Component - Now uses SearchProfessionalService which has the professional embedded
function ServiceCard({ 
  service, 
  viewMode, 
  router,
  formatDuration
}: { 
  service: SearchProfessionalService; 
  viewMode: "grid" | "list";
  router: ReturnType<typeof useRouter>;
  formatDuration: (duration: number | string | undefined) => string;
}) {
  const formatPrice = (price?: string | number) => {
    if (price === null || price === undefined) return null;
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? null : numPrice;
  };

  const priceValue = formatPrice(service.price);
  const professional = service.profissional;
  // Use entity type color for services (green/emerald)
  const typeColor = entityTypeColors.service;

  const handleClick = () => {
    // Go directly to booking page with the professional who offers this service
    router.push(`/booking/${professional.id}?serviceId=${service.id}`);
  };

  return (
    <Card
      className={`hover:shadow-lg transition-all cursor-pointer overflow-hidden border-l-4 ${typeColor.border} h-full`}
      onClick={handleClick}
    >
      {/* Image header for grid view */}
      {viewMode === "grid" && service.image && (
        <div className="relative h-28 w-full bg-muted">
          <img 
            src={service.image} 
            alt={service.name}
            className="w-full h-full object-cover"
          />
          {service.category && (
            <Badge className={`absolute top-2 left-2 text-xs ${typeColor.badge}`}>
              {service.category.name}
            </Badge>
          )}
        </div>
      )}
      
      <CardContent className="p-4">
        {/* Service name and price */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base truncate">{service.name}</h3>
            {service.description && viewMode === "grid" && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {service.description}
              </p>
            )}
          </div>
          {priceValue !== null && (
            <span className="text-lg font-bold text-primary shrink-0">
              R$ {priceValue}
            </span>
          )}
        </div>
        
        {/* Duration and category */}
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
          {service.duration && (
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(service.duration)}
            </span>
          )}
          {(service.company || professional.company) && (
            <span className="truncate">
              {service.company?.name || professional.company?.name}
            </span>
          )}
        </div>

        {/* Professional info footer */}
        {professional && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={professional.image || undefined} />
              <AvatarFallback className="text-xs">
                {professional.name?.charAt(0) || "P"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate flex-1">
              {professional.name}
            </span>
            {professional.rating > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{professional.rating.toFixed(1)}</span>
              </div>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Grouped Service Card Component - Shows aggregated service with price range and multiple professionals
interface GroupedServiceType {
  name: string;
  category: { id: number; name: string } | null;
  image: string | undefined;
  description: string;
  minPrice: number;
  maxPrice: number;
  minDuration: number; // in minutes
  maxDuration: number; // in minutes
  minRating: number;
  maxRating: number;
  professionals: Array<{
    id: string;
    name: string;
    image: string | null;
    rating: number;
    price: number;
    duration: number; // in minutes
    serviceId: string;
  }>;
}

function GroupedServiceCard({ 
  groupedService, 
  viewMode, 
  router,
  formatDuration
}: { 
  groupedService: GroupedServiceType; 
  viewMode: "grid" | "list";
  router: ReturnType<typeof useRouter>;
  formatDuration: (duration: number | string | undefined) => string;
}) {
  const typeColor = entityTypeColors.service;
  const profCount = groupedService.professionals.length;
  const hasPriceRange = groupedService.minPrice !== groupedService.maxPrice;
  const hasDurationRange = groupedService.minDuration !== groupedService.maxDuration && groupedService.minDuration > 0 && groupedService.maxDuration > 0;
  const hasRatingRange = groupedService.minRating !== groupedService.maxRating && groupedService.minRating > 0 && groupedService.maxRating > 0;
  
  // Sort professionals by rating
  const sortedProfessionals = [...groupedService.professionals].sort((a, b) => b.rating - a.rating);
  const topProfessionals = sortedProfessionals.slice(0, 4);
  
  // Modal state for quick professional selection
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (profCount === 1) {
      // Single professional - go directly to booking
      const prof = groupedService.professionals[0];
      router.push(`/booking/${prof.id}?serviceId=${prof.serviceId}`);
    } else {
      // Multiple professionals - go to service details page to choose
      const firstServiceId = groupedService.professionals[0]?.serviceId;
      if (firstServiceId) {
        router.push(`/service/${firstServiceId}`);
      }
    }
  };
  
  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };
  
  const handleSelectProfessional = (prof: typeof sortedProfessionals[0]) => {
    setIsModalOpen(false);
    router.push(`/booking/${prof.id}?serviceId=${prof.serviceId}`);
  };

  return (
    <Card
      className={`hover:shadow-lg transition-all cursor-pointer overflow-hidden border-l-4 ${typeColor.border} h-full`}
      onClick={handleClick}
    >
      {/* Image header for grid view */}
      {viewMode === "grid" && groupedService.image && (
        <div className="relative h-28 w-full bg-muted">
          <img 
            src={groupedService.image} 
            alt={groupedService.name}
            className="w-full h-full object-cover"
          />
          {groupedService.category && (
            <Badge className={`absolute top-2 left-2 text-xs ${typeColor.badge}`}>
              {groupedService.category.name}
            </Badge>
          )}
          {profCount > 1 && (
            <Badge className="absolute top-2 right-2 text-xs bg-black/70 text-white border-0">
              {profCount} profissionais
            </Badge>
          )}
        </div>
      )}
      
      <CardContent className="p-4">
        {/* Service name and price range */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base truncate">{groupedService.name}</h3>
            {groupedService.description && viewMode === "grid" && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {groupedService.description}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            {hasPriceRange ? (
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">a partir de</span>
                <span className="text-lg font-bold text-primary">
                  R$ {groupedService.minPrice.toFixed(0)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-primary">
                R$ {groupedService.minPrice.toFixed(0)}
              </span>
            )}
          </div>
        </div>
        
        {/* Duration and rating ranges */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-muted-foreground">
          {groupedService.minDuration > 0 && (
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="h-3.5 w-3.5" />
              {hasDurationRange 
                ? `${groupedService.minDuration} a ${groupedService.maxDuration} min`
                : `${groupedService.minDuration} min`
              }
            </span>
          )}
          {groupedService.maxRating > 0 && (
            <span className="flex items-center gap-1 shrink-0">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {hasRatingRange 
                ? `${groupedService.minRating.toFixed(1)} a ${groupedService.maxRating.toFixed(1)}`
                : groupedService.maxRating.toFixed(1)
              }
            </span>
          )}
        </div>

        {/* Professionals footer */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t">
          <div className="flex items-center gap-2 min-w-0">
            {/* Stacked avatars */}
            <div className="flex -space-x-2">
              {topProfessionals.map((prof) => (
                <Avatar key={prof.id} className="h-6 w-6 border-2 border-background shrink-0">
                  <AvatarImage src={prof.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {prof.name?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm text-muted-foreground truncate">
              {profCount === 1 ? sortedProfessionals[0].name : `${profCount} profissionais`}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {profCount > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-primary/10"
                onClick={handleExpandClick}
                title="Ver todos os profissionais"
              >
                <Expand className="h-4 w-4 text-primary" />
              </Button>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
      
      {/* Quick Selection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              {groupedService.name}
            </DialogTitle>
            <DialogDescription>
              Selecione um profissional para agendar
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto space-y-2 py-2">
            {sortedProfessionals.map((prof) => (
              <button
                key={prof.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectProfessional(prof);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={prof.image || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {prof.name?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                    {prof.name}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                    {prof.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        {prof.rating.toFixed(1)}
                      </span>
                    )}
                    {prof.duration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {prof.duration} min
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <span className="text-lg font-bold text-primary">
                    R$ {prof.price.toFixed(0)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto mt-1 group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
          
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
                const firstServiceId = groupedService.professionals[0]?.serviceId;
                if (firstServiceId) {
                  router.push(`/service/${firstServiceId}`);
                }
              }}
            >
              Ver detalhes do serviço
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Company Card Component
function CompanyCard({ 
  company, 
  viewMode, 
  router,
  getInitials 
}: { 
  company: SearchCompany; 
  viewMode: "grid" | "list";
  router: ReturnType<typeof useRouter>;
  getInitials: (name?: string) => string;
}) {
  // Use entity type color for companies (purple/violet)
  const typeColor = entityTypeColors.company;

  return (
    <Card
      className={`hover:shadow-lg transition-all cursor-pointer border-l-4 ${typeColor.border} h-full`}
      onClick={() => router.push(`/company/${company.id}`)}
    >
      <CardContent className="p-4">
        {/* Header row with logo, name and arrow */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={company.logo} />
              <AvatarFallback className={`text-sm ${typeColor.bg} ${typeColor.text}`}>
                {getInitials(company.name)}
              </AvatarFallback>
            </Avatar>
            {company.rating >= 4.5 && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-0.5">
                <Award className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-base truncate">
                {company.name}
              </h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
            
            {company.address && (
              <p className="text-sm text-muted-foreground truncate">
                {company.address.city}, {company.address.state}
              </p>
            )}
          </div>
        </div>

        {/* Info row: rating and categories */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          {/* Rating */}
          {company.rating > 0 ? (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{company.rating.toFixed(1)}</span>
              {company.totalReviews > 0 && (
                <span className="text-xs text-muted-foreground">({company.totalReviews})</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Novo</span>
          )}

          {/* Categories - just show count or first one */}
          {company.categories && company.categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Badge variant="secondary" className="text-xs shrink-0 max-w-[100px] truncate">
                {company.categories[0]}
              </Badge>
              {company.categories.length > 1 && (
                <span className="text-xs text-muted-foreground shrink-0">
                  +{company.categories.length - 1}
                </span>
              )}
            </div>
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
