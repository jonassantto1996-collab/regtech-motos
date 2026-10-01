export type StoreOverviewMetrics={
 total_stock:number;
 low_stock:number;
 out_of_stock:number;
 products_without_variants:number;
};
export type StoreOverviewAlert={
 id:string;
 product_id?:string;
 brand:string;
 product_name?:string;
 name:string;
 sku?:string|null;
 stock_quantity?:number;
 low_stock_threshold?:number;
};
export type StoreAdminOverview={
 metrics:StoreOverviewMetrics;
 category_counts:Record<string,number>;
 alerts:{
  out_of_stock:StoreOverviewAlert[];
  low_stock:StoreOverviewAlert[];
  without_variants:StoreOverviewAlert[];
 };
};
