import { FabActions } from "@/components/fab-actions";
import { Restaurant } from "@/types/restaurant";
import type { Metadata } from "next";
import data from "../../../../public/coffee_mapdata.json";

type CoffeeMapResponse = {
  locations: Restaurant[];
  status?: string;
};

async function getRestaurant(id: string): Promise<Restaurant | null> {
  // const base = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  try {
    // const res = await fetch(`${base}/coffee_mapdata.json`, {
    //   // Allow caching but keep it reasonably fresh
    //   next: { revalidate: 300 },
    // });
    // if (!res.ok) return null;
    // const data = (await res.json()) as CoffeeMapResponse;
    if (!data || !Array.isArray(data.locations)) return null;
    return (data.locations as any).find((l: any) => l._id === id) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const restaurant = await getRestaurant(id);

  const title = restaurant
    ? `${restaurant.name} — Restaurant`
    : "Restaurant Details";

  const addressParts = [restaurant?.address_line1, restaurant?.address_line2]
    .filter(Boolean)
    .join(", ");

  const priceInfo = restaurant?.price ? ` • ${restaurant.price}` : "";
  const cashbackInfo =
    restaurant?.cashback_rate && restaurant.cashback_rate > 0
      ? ` • ${restaurant.cashback_rate}% cashback`
      : "";

  const description = restaurant
    ? `${addressParts}${priceInfo}${cashbackInfo}`
    : "View restaurant details, address and pay with crypto.";

  const imageUrl =
    restaurant?.logo_url ||
    process.env.NEXT_PUBLIC_APP_HERO_IMAGE ||
    "/logo.png";

  return {
    title,
    description,
    alternates: {
      canonical: `/lifestyle/${id}`,
    },
    openGraph: {
      title: restaurant?.name || title,
      description,
      images: [imageUrl],
      url: `${process.env.NEXT_PUBLIC_URL}/lifestyle/${id}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: restaurant?.name || title,
      description,
      images: [imageUrl],
    },
    other: restaurant
      ? {
          "restaurant:name": restaurant.name,
          "restaurant:address": addressParts,
          "restaurant:price": restaurant.price || "",
          "restaurant:cashback_rate": restaurant.cashback_rate.toString(),
          "geo:latitude": restaurant.lat.toString(),
          "geo:longitude": restaurant.lon.toString(),
        }
      : undefined,
  };
}

export default function RestaurantDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full">
      {children}
      <FabActions className="fixed bottom-20" />
    </div>
  );
}
