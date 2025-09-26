"use client";

import { PageHeader } from "@/components/page-header";
import { ContactSupport } from "@/components/ui/contact-support";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  convertToUSD,
  EXCHANGE_RATES,
  getDisplayCurrency,
  getFirstTwoWordInitialsFromName,
} from "@/lib/utils";
import { Restaurant } from "@/types/restaurant";
import { BadgePercent, CreditCard, MapPin, Share } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef } from "react";

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;

  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState<string>("");
  const [points, setPoints] = React.useState(0);
  const [pointsLoading, setPointsLoading] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [dialogLoading, setDialogLoading] = React.useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastResetAmountRef = useRef<string>("");
  const [appId, setAppId] = React.useState<string>("");

  const metadata = useMemo(() => {
    return {
      amount_local: paymentAmount,
      currency_local: getDisplayCurrency(restaurant?.currency),
    };
  }, [paymentAmount, restaurant?.currency]);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const res = await fetch("/coffee_mapdata.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();

        const foundRestaurant = data.locations.find(
          (loc: Restaurant) => loc._id === restaurantId
        );
        if (!foundRestaurant) {
          throw new Error("Lifestyle not found");
        }

        console.log("foundRestaurant", foundRestaurant);

        setRestaurant(foundRestaurant as Restaurant);

        let price = 0;
        if (foundRestaurant.price && !isNaN(Number(foundRestaurant.price))) {
          price = Number(foundRestaurant.price);
          setPaymentAmount(price.toFixed(2));
        }

        const displayCurrency = foundRestaurant.currency || "USD";
        const usdAmount = convertToUSD(price.toFixed(2), displayCurrency);

        const appId = `rozoRewardsBNBStellarMP-${foundRestaurant.handle || ""}`;
        setAppId(appId);

        // resetPayment({
        //   appId: appId,
        //   intent: `${foundRestaurant.name} - ${displayCurrency} ${price.toFixed(
        //     2
        //   )}`,
        //   toAddress: "0x5772FBe7a7817ef7F586215CA8b23b8dD22C8897",
        //   toChain: baseUSDC.chainId,
        //   toToken: baseUSDC.token as `0x${string}`,
        //   toUnits: usdAmount,
        // });

        // Store initial amount to prevent unnecessary resets
        lastResetAmountRef.current = price.toFixed(2);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    if (restaurantId) {
      loadRestaurant();
    }
  }, [restaurantId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const [isDebouncing, setIsDebouncing] = React.useState(false);

  const handleAmountChange = (value: string) => {
    if (!restaurant) return;
    setPaymentAmount(value);
    setIsDebouncing(true);

    // Clear the previous timer if it exists
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer
    debounceTimerRef.current = setTimeout(() => {
      const displayCurrency = getDisplayCurrency(restaurant.currency);
      const usdAmount = convertToUSD(value, displayCurrency);

      const appId = `rozoRewardsBNBStellarMP-${restaurant.handle || ""}`;
      setAppId(appId);

      setIsDebouncing(false);
      debounceTimerRef.current = null;
    }, 500);
  };

  const handlePayWithPoints = () => {
    setShowConfirmDialog(true);
  };

  const handleShare = () => {
    const text = `Check out ${restaurant?.name} at ${
      restaurant?.address_line1
    }!${
      restaurant?.cashback_rate
        ? ` Get ${restaurant.cashback_rate}% cashback!`
        : ""
    }`;

    (async () => {
      try {
        const shareData: ShareData = {
          title: text,
          url: window.location.href,
        };
        await navigator.share(shareData);
        console.log("Shared successfully");
      } catch (err) {
        console.error(`Error sharing: ${err}`);
      }
    })();
  };

  if (loading) {
    return (
      <div className="w-full mb-16 flex flex-col gap-4 mt-4 px-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-muted animate-pulse rounded-md" />
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        </div>
        <Card className="w-full">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="size-16 sm:size-20 rounded-lg bg-muted animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 sm:h-6 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
              <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-11 w-full bg-muted animate-pulse rounded-md" />
            <div className="h-11 w-full bg-muted animate-pulse rounded-md" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="w-full mb-16 flex flex-col gap-4 mt-4 px-4">
        <PageHeader title="Back to Lifestyle" isBackButton />
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-destructive text-lg font-medium mb-2">
              {error || "Restaurant not found"}
            </p>
            <p className="text-muted-foreground mb-4">
              The restaurant you&apos;re looking for doesn&apos;t exist or has
              been removed.
            </p>
            <Button onClick={() => router.push("/lifestyle")} variant="outline">
              Back to Lifestyle
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = getFirstTwoWordInitialsFromName(restaurant.name);

  return (
    <div className="w-full mb-16 flex flex-col gap-4 mt-4 px-4">
      {/* Header */}
      <PageHeader title="Back to Lifestyle" isBackButton />

      {/* Restaurant Info Card */}
      <Card className="w-full gap-3">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Avatar className="size-16 sm:size-20 rounded-lg ring-1 ring-border bg-muted flex-shrink-0">
              <AvatarImage src={restaurant.logo_url} alt={restaurant.name} />
              <AvatarFallback
                title={restaurant.name}
                className="font-medium text-base sm:text-lg"
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-2">
              <h2
                className="text-xl sm:text-2xl font-bold leading-tight"
                title={restaurant.name}
              >
                {restaurant.name}
              </h2>
              <Link
                href={`https://maps.google.com/?q=${restaurant.lat},${restaurant.lon}`}
                target="_blank"
                className="flex items-start gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
              >
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 group-hover:text-blue-600 transition-colors" />
                <div className="text-sm leading-relaxed group-hover:underline">
                  <p className="font-medium">{restaurant.address_line1}</p>
                  {restaurant.address_line2 && (
                    <p>{restaurant.address_line2}</p>
                  )}
                </div>
              </Link>
              {/* Price and Cashback Details */}
              <div className="flex items-center gap-3 pt-1">
                {restaurant.price && (
                  <p className="text-sm text-muted-foreground">
                    Price: <b>{restaurant.price}</b>
                  </p>
                )}
                {restaurant.cashback_rate > 0 && (
                  <Badge
                    variant="default"
                    className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full"
                  >
                    <BadgePercent className="size-3" />
                    Cashback: <b>{restaurant.cashback_rate}%</b>
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Button onClick={handleShare} variant="default" size="icon">
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {/* Action Buttons */}
          {restaurant.is_live && (
            <div className="flex flex-col gap-3 pt-2 mb-6">
              <div className="space-y-3">
                {/* Amount Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="payment-amount"
                    className="text-sm font-medium"
                  >
                    Payment Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {getDisplayCurrency(restaurant?.currency)}
                    </span>
                    <Input
                      id="payment-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className={`pl-12 h-11 sm:h-12 text-sm sm:text-base [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance]:textfield`}
                    />
                  </div>

                  {getDisplayCurrency(restaurant?.currency) !== "USD" && (
                    <p className="text-xs text-muted-foreground">
                      <span className="text-muted-foreground font-medium">
                        Exchange rate: 1{" "}
                        {getDisplayCurrency(restaurant?.currency)} ={" "}
                        {(
                          1 /
                          (EXCHANGE_RATES[
                            getDisplayCurrency(restaurant?.currency)
                          ] || 1)
                        ).toFixed(2)}{" "}
                        USD
                      </span>
                    </p>
                  )}
                </div>

                {paymentAmount && (
                  <Button variant="default" className="w-full">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                    Pay {getDisplayCurrency(restaurant?.currency)}{" "}
                    {paymentAmount}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Contact & Support */}
          <ContactSupport />
        </CardContent>
      </Card>
    </div>
  );
}
