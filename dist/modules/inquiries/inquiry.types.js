"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductType = exports.InquiryTypeEnum = exports.InquiryStatus = void 0;
var InquiryStatus;
(function (InquiryStatus) {
    InquiryStatus["New"] = "New";
    InquiryStatus["Processed"] = "InProgress";
    InquiryStatus["Converted"] = "Converted";
    InquiryStatus["Closed"] = "Closed";
})(InquiryStatus || (exports.InquiryStatus = InquiryStatus = {}));
var InquiryTypeEnum;
(function (InquiryTypeEnum) {
    InquiryTypeEnum["PricingRequest"] = "PricingRequest";
    InquiryTypeEnum["ProductAvailability"] = "ProductAvailability";
    InquiryTypeEnum["TechnicalQuestion"] = "TechnicalQuestion";
    InquiryTypeEnum["DeliveryInquiry"] = "DeliveryInquiry";
    InquiryTypeEnum["Other"] = "Other";
})(InquiryTypeEnum || (exports.InquiryTypeEnum = InquiryTypeEnum = {}));
var ProductType;
(function (ProductType) {
    ProductType["AGGREGATE"] = "AGGREGATE";
    ProductType["HEAVY_EQUIPMENT"] = "HEAVY_EQUIPMENT";
    ProductType["STEEL"] = "STEEL";
})(ProductType || (exports.ProductType = ProductType = {}));
