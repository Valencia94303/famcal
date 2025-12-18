import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// WMO Weather interpretation codes to human-readable descriptions and icons
const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: "Clear sky", icon: "sun" },
  1: { description: "Mainly clear", icon: "sun" },
  2: { description: "Partly cloudy", icon: "cloud-sun" },
  3: { description: "Overcast", icon: "cloud" },
  45: { description: "Foggy", icon: "cloud-fog" },
  48: { description: "Depositing rime fog", icon: "cloud-fog" },
  51: { description: "Light drizzle", icon: "cloud-drizzle" },
  53: { description: "Moderate drizzle", icon: "cloud-drizzle" },
  55: { description: "Dense drizzle", icon: "cloud-drizzle" },
  56: { description: "Light freezing drizzle", icon: "cloud-drizzle" },
  57: { description: "Dense freezing drizzle", icon: "cloud-drizzle" },
  61: { description: "Slight rain", icon: "cloud-rain" },
  63: { description: "Moderate rain", icon: "cloud-rain" },
  65: { description: "Heavy rain", icon: "cloud-rain" },
  66: { description: "Light freezing rain", icon: "cloud-rain" },
  67: { description: "Heavy freezing rain", icon: "cloud-rain" },
  71: { description: "Slight snow", icon: "cloud-snow" },
  73: { description: "Moderate snow", icon: "cloud-snow" },
  75: { description: "Heavy snow", icon: "cloud-snow" },
  77: { description: "Snow grains", icon: "cloud-snow" },
  80: { description: "Slight rain showers", icon: "cloud-sun-rain" },
  81: { description: "Moderate rain showers", icon: "cloud-sun-rain" },
  82: { description: "Violent rain showers", icon: "cloud-sun-rain" },
  85: { description: "Slight snow showers", icon: "cloud-snow" },
  86: { description: "Heavy snow showers", icon: "cloud-snow" },
  95: { description: "Thunderstorm", icon: "cloud-lightning" },
  96: { description: "Thunderstorm with slight hail", icon: "cloud-lightning" },
  99: { description: "Thunderstorm with heavy hail", icon: "cloud-lightning" },
};

interface OpenMeteoResponse {
  current_weather: {
    temperature: number;
    weathercode: number;
    is_day: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

// GET weather data
export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings?.weatherLat || !settings?.weatherLon) {
      return NextResponse.json(
        { error: "Weather location not configured" },
        { status: 400 }
      );
    }

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", settings.weatherLat.toString());
    url.searchParams.set("longitude", settings.weatherLon.toString());
    url.searchParams.set("current_weather", "true");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("timezone", "auto");

    const response = await fetch(url.toString(), {
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data: OpenMeteoResponse = await response.json();
    const weatherCode = data.current_weather.weathercode;
    const weatherInfo = WEATHER_CODES[weatherCode] || {
      description: "Unknown",
      icon: "cloud",
    };

    return NextResponse.json({
      temp: Math.round(data.current_weather.temperature),
      condition: weatherInfo.description,
      icon: weatherInfo.icon,
      isDay: data.current_weather.is_day === 1,
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      city: settings.weatherCity || null,
    });
  } catch (error) {
    console.error("Error fetching weather:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather" },
      { status: 500 }
    );
  }
}
