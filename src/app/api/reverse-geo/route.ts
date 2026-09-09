import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ success: false, error: "缺少經緯度參數" }, { status: 400 });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ success: false, error: "無效的經緯度數值" }, { status: 400 });
    }

    // Call OpenStreetMap Nominatim reverse geocoder
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=zh-TW`;

    try {
      const response = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": "TaiwanYouthRightsCheckInSystem/1.0 (contact@youthrights.org.tw)",
          Accept: "application/json",
        },
        next: { revalidate: 3600 },
      });

      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};

        // Assemble clean Taiwanese address format
        const city = addr.city || addr.county || addr.town || addr.municipality || "";
        const district = addr.suburb || addr.city_district || addr.district || addr.town || "";
        const road = addr.road || addr.street || addr.neighbourhood || addr.pedestrian || "";
        const houseNumber = addr.house_number ? `${addr.house_number}號` : "";
        const building = addr.building || addr.amenity || "";

        let cleanAddress = [city, district, road, houseNumber, building]
          .filter(Boolean)
          .join("");

        if (!cleanAddress && data.display_name) {
          cleanAddress = data.display_name;
        }

        return NextResponse.json({
          success: true,
          address: cleanAddress || `經緯度座標: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          raw: data,
        });
      }
    } catch (fetchErr) {
      console.warn("Nominatim fetch failed, using fallback:", fetchErr);
    }

    // Fallback: return coordinate label
    return NextResponse.json({
      success: true,
      address: `經緯度座標: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    });
  } catch (error) {
    console.error("GET /api/reverse-geo error:", error);
    return NextResponse.json({
      success: true,
      address: "位置解析異常，已以座標記錄",
    });
  }
}
