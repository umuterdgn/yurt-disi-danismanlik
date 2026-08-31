"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const universities = [
  {
    id: 1,
    name: "Varsovia University",
    country: "Polonya",
    city: "Varşova",
    annualFee: 2500,
    currency: "EUR",
    deadline: "15.09.2026",
    language: "İngilizce",
    level: "Lisans",
    ranking: 350,
    departments: ["Bilgisayar Müh.", "İşletme", "Ekonomi"]
  },
  {
    id: 2,
    name: "Politecnico di Milano",
    country: "İtalya",
    city: "Milano",
    annualFee: 3500,
    currency: "EUR",
    deadline: "30.09.2026",
    language: "İngilizce",
    level: "Lisans",
    ranking: 150,
    departments: ["Mühendislik", "Mimarlık", "Tasarım"]
  },
  {
    id: 3,
    name: "TU Munich",
    country: "Almanya",
    city: "Münih",
    annualFee: 0,
    currency: "EUR",
    deadline: "15.07.2026",
    language: "Almanca",
    level: "Lisans",
    ranking: 50,
    departments: ["Mühendislik", "Fizik", "Kimya"]
  },
  {
    id: 4,
    name: "University of Bucharest",
    country: "Romanya",
    city: "Bükreş",
    annualFee: 2000,
    currency: "EUR",
    deadline: "01.09.2026",
    language: "İngilizce",
    level: "Lisans",
    ranking: 800,
    departments: ["Hukuk", "Tıp", "Sosyal Bilimler"]
  },
  {
    id: 5,
    name: "Jagiellonian University",
    country: "Polonya",
    city: "Kraków",
    annualFee: 3000,
    currency: "EUR",
    deadline: "20.08.2026",
    language: "İngilizce",
    level: "Lisans",
    ranking: 300,
    departments: ["Tıp", "Biyoloji", "Kimya"]
  },
  {
    id: 6,
    name: "University of Bologna",
    country: "İtalya",
    city: "Bologna",
    annualFee: 2800,
    currency: "EUR",
    deadline: "10.09.2026",
    language: "İngilizce",
    level: "Lisans",
    ranking: 180,
    departments: ["Hukuk", "Ekonomi", "Mühendislik"]
  },
  {
    id: 7,
    name: "Heidelberg University",
    country: "Almanya",
    city: "Heidelberg",
    annualFee: 0,
    currency: "EUR",
    deadline: "15.07.2026",
    language: "Almanca",
    level: "Lisans",
    ranking: 60,
    departments: ["Tıp", "Felsefe", "Doğa Bilimleri"]
  },
  {
    id: 8,
    name: "Babeș-Bolyai University",
    country: "Romanya",
    city: "Cluj-Napoca",
    annualFee: 1800,
    currency: "EUR",
    deadline: "25.08.2026",
    language: "İngilizce",
    level: "Lisans",
    ranking: 900,
    departments: ["Matematik", "Bilgisayar", "Psikoloji"]
  }
];

const countries = ["Tümü", "Polonya", "İtalya", "Almanya", "Romanya"];
const departments = ["Tümü", "Mühendislik", "Tıp", "Hukuk", "İşletme", "Ekonomi", "Sosyal Bilimler"];
const languages = ["Tümü", "İngilizce", "Almanca"];
const budgets = ["Tümü", "0-2000 €", "2000-3000 €", "3000+ €"];

export default function UniversitiesPage() {
  const [selectedCountry, setSelectedCountry] = useState("Tümü");
  const [selectedDepartment, setSelectedDepartment] = useState("Tümü");
  const [selectedLanguage, setSelectedLanguage] = useState("Tümü");
  const [selectedBudget, setSelectedBudget] = useState("Tümü");

  const filteredUniversities = universities.filter((uni) => {
    const countryMatch = selectedCountry === "Tümü" || uni.country === selectedCountry;
    const departmentMatch = selectedDepartment === "Tümü" || uni.departments.includes(selectedDepartment);
    const languageMatch = selectedLanguage === "Tümü" || uni.language === selectedLanguage;
    
    let budgetMatch = true;
    if (selectedBudget === "0-2000 €") {
      budgetMatch = uni.annualFee <= 2000;
    } else if (selectedBudget === "2000-3000 €") {
      budgetMatch = uni.annualFee > 2000 && uni.annualFee <= 3000;
    } else if (selectedBudget === "3000+ €") {
      budgetMatch = uni.annualFee > 3000;
    }

    return countryMatch && departmentMatch && languageMatch && budgetMatch;
  });

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      "Polonya": "🇵🇱",
      "İtalya": "🇮🇹",
      "Almanya": "🇩🇪",
      "Romanya": "🇷🇴"
    };
    return flags[country] || "🌍";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Üniversite & Ülke Keşif</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <Card className="lg:w-72 h-fit">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Filtreler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Country Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ülke</label>
                <div className="space-y-1">
                  {countries.map((country) => (
                    <button
                      key={country}
                      onClick={() => setSelectedCountry(country)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedCountry === country
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {country === "Tümü" ? country : `${getCountryFlag(country)} ${country}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Department Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bölüm</label>
                <div className="space-y-1">
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setSelectedDepartment(dept)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedDepartment === dept
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Dil Seviyesi</label>
                <div className="space-y-1">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedLanguage === lang
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Maksimum Bütçe</label>
                <div className="space-y-1">
                  {budgets.map((budget) => (
                    <button
                      key={budget}
                      onClick={() => setSelectedBudget(budget)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedBudget === budget
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {budget}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => {
                  setSelectedCountry("Tümü");
                  setSelectedDepartment("Tümü");
                  setSelectedLanguage("Tümü");
                  setSelectedBudget("Tümü");
                }}
                variant="outline"
                className="w-full"
              >
                Filtreleri Temizle
              </Button>
            </CardContent>
          </Card>

          {/* University Cards Grid */}
          <div className="flex-1">
            <div className="mb-6">
              <p className="text-gray-600">
                {filteredUniversities.length} üniversite bulundu
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredUniversities.map((uni) => (
                <Card key={uni.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                          {uni.name}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{getCountryFlag(uni.country)}</span>
                          <span>{uni.city}, {uni.country}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        #{uni.ranking}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Yıllık Ücret</span>
                      <span className="font-semibold text-gray-900">
                        {uni.annualFee === 0 ? "Ücretsiz" : `${uni.annualFee} ${uni.currency}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Son Başvuru</span>
                      <span className="font-semibold text-gray-900">{uni.deadline}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Dil</span>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        {uni.language}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Seviye</span>
                      <Badge variant="outline">{uni.level}</Badge>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Bölümler</p>
                      <div className="flex flex-wrap gap-1">
                        {uni.departments.slice(0, 3).map((dept, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {dept}
                          </Badge>
                        ))}
                        {uni.departments.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{uni.departments.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Detayları Gör
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredUniversities.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-gray-500 text-lg">Filtrelere uygun üniversite bulunamadı.</p>
                <Button
                  onClick={() => {
                    setSelectedCountry("Tümü");
                    setSelectedDepartment("Tümü");
                    setSelectedLanguage("Tümü");
                    setSelectedBudget("Tümü");
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Filtreleri Temizle
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
