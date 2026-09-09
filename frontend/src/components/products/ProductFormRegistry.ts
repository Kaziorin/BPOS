import React from "react";
import { PharmacyProductFields, PharmacyFormData } from "./verticals/PharmacyProductFields";
import { RestaurantProductFields, RestaurantFormData } from "./verticals/RestaurantProductFields";
import { ServiceProductFields, ServiceFormData } from "./verticals/ServiceProductFields";
import { GroceryProductFields, GroceryFormData } from "./verticals/GroceryProductFields";
import { WholesaleProductFields, WholesaleFormData } from "./verticals/WholesaleProductFields";
import { ManufacturingProductFields, ManufacturingFormData } from "./verticals/ManufacturingProductFields";
import { RetailProductFields, RetailFormData } from "./verticals/RetailProductFields";
import { FranchiseProductFields, FranchiseFormData } from "./verticals/FranchiseProductFields";

export type BusinessTypeKey =
  | "RETAIL"
  | "RESTAURANT"
  | "PHARMACY"
  | "GROCERY"
  | "WHOLESALE"
  | "MANUFACTURING"
  | "SALON"
  | "REPAIR"
  | "FRANCHISE";

export interface VerticalFormState {
  pharmacy: PharmacyFormData;
  restaurant: RestaurantFormData;
  service: ServiceFormData;
  grocery: GroceryFormData;
  wholesale: WholesaleFormData;
  manufacturing: ManufacturingFormData;
  retail: RetailFormData;
  franchise: FranchiseFormData;
}

export const initialVerticalFormState: VerticalFormState = {
  pharmacy: {
    genericName: "",
    dosageForm: "Tablet",
    speciesType: "HUMAN",
    manufacturer: "",
    isPrescriptionRequired: false,
    hasBatchExpiry: true,
    stripsPerBox: "10",
    tabletsPerStrip: "10",
    storageCondition: "Room Temperature (Below 25°C)",
    sideEffectsNotes: "",
  },
  restaurant: {
    isKitchenProduct: true,
    prepTimeMinutes: "15",
    kitchenStation: "Main Kitchen KDS",
    dineInTaxRate: "5",
    takeawayTaxRate: "5",
    hasRecipeBom: false,
    isVegetarian: false,
    isHalal: true,
    isChefSpecial: false,
    isGlutenFree: false,
    spiceLevel: "None / Mild",
    dineInAvailable: true,
    takeawayAvailable: true,
    deliveryAvailable: true,
    addons: [],
    modifierGroups: [],
    relatedProducts: [],
    recipeBom: [],
  },
  service: {
    durationMinutes: "30",
    technicianCommissionPercent: "10",
    isAppointmentRequired: false,
    warrantyPeriodDays: "30",
    requiresSerialNumber: false,
    laborChargeOnly: true,
    serviceCategoryType: "GENERAL",
  },
  grocery: {
    pluCode: "",
    isWeightedScaleItem: false,
    pricePerUnitBasis: "Per Kilogram (Kg)",
    shelfLocation: "",
    expiryWarningDays: "15",
    isLooseItem: false,
  },
  wholesale: {
    moq: "1",
    unitsPerCarton: "24",
    isCreditEligible: true,
    priceTiers: [
      { minQty: "1", maxQty: "10", unitPrice: "" },
      { minQty: "11", maxQty: "50", unitPrice: "" },
    ],
  },
  manufacturing: {
    itemRole: "FINISHED_GOOD",
    yieldFactorPercent: "100",
    standardLaborCost: "0",
    overheadCost: "0",
  },
  retail: {
    seasonCollection: "All Season",
    targetGender: "Unisex",
    hasVariantMatrix: false,
    warrantyPeriodMonths: "0",
    isReturnable: true,
  },
  franchise: {
    masterCatalogSku: "",
    royaltyRatePercent: "5.0",
    allowBranchPriceOverride: true,
    isCentralRestricted: false,
  },
};

export function renderVerticalProductFields(
  businessType: string,
  verticalState: VerticalFormState,
  onUpdateVertical: (module: keyof VerticalFormState, field: string, val: any) => void
): React.ReactNode {
  const normalizedType = (businessType || "RETAIL").toUpperCase();

  switch (normalizedType) {
    case "PHARMACY":
    case "MEDICINE":
      return React.createElement(PharmacyProductFields, {
        formData: verticalState.pharmacy,
        onChange: (field: any, val: any) => onUpdateVertical("pharmacy", field, val),
      });

    case "RESTAURANT":
    case "FOOD":
      return React.createElement(RestaurantProductFields, {
        formData: verticalState.restaurant,
        onChange: (field: any, val: any) => onUpdateVertical("restaurant", field, val),
      });

    case "SALON":
    case "SPA":
      return React.createElement(ServiceProductFields, {
        formData: verticalState.service,
        mode: "SALON",
        onChange: (field: any, val: any) => onUpdateVertical("service", field, val),
      });

    case "REPAIR":
    case "SERVICE":
      return React.createElement(ServiceProductFields, {
        formData: verticalState.service,
        mode: "REPAIR",
        onChange: (field: any, val: any) => onUpdateVertical("service", field, val),
      });

    case "GROCERY":
    case "SUPERMARKET":
      return React.createElement(GroceryProductFields, {
        formData: verticalState.grocery,
        onChange: (field: any, val: any) => onUpdateVertical("grocery", field, val),
      });

    case "WHOLESALE":
    case "DISTRIBUTION":
      return React.createElement(WholesaleProductFields, {
        formData: verticalState.wholesale,
        onChange: (field: any, val: any) => onUpdateVertical("wholesale", field, val),
      });

    case "MANUFACTURING":
    case "BAKERY":
      return React.createElement(ManufacturingProductFields, {
        formData: verticalState.manufacturing,
        onChange: (field: any, val: any) => onUpdateVertical("manufacturing", field, val),
      });

    case "FRANCHISE":
      return React.createElement(FranchiseProductFields, {
        formData: verticalState.franchise,
        onChange: (field: any, val: any) => onUpdateVertical("franchise", field, val),
      });

    case "RETAIL":
    default:
      return React.createElement(RetailProductFields, {
        formData: verticalState.retail,
        onChange: (field: any, val: any) => onUpdateVertical("retail", field, val),
      });
  }
}
