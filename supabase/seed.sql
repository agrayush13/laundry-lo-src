-- laundrylo seed data: the Bengaluru demo set used by local and preview environments
-- and API integration fixtures, represented as rows. Run by `supabase db reset`.
--
-- Prices are per partner: a base rate card scaled by a per-partner factor, so
-- `startingPrice` in the API is min(active item) and cannot be set to a number
-- the catalogue does not actually offer.

-- This is a destructive demo reset, not an incremental staging seed. Name the
-- entire affected graph so adding a new foreign key makes this fail visibly
-- rather than letting CASCADE erase a table nobody knew was in scope.
truncate table public.order_events, public.order_addresses, public.order_items,
               public.reviews, public.orders, public.cart_items, public.carts,
               public.slots, public.catalog_items, public.catalog_categories,
               public.partner_tags, public.partner_hours, public.partners,
               public.pincode_centroids restart identity;

-- Pincode centroids: distance is measured from the searched pincode.
insert into public.pincode_centroids (pincode, city, latitude, longitude) values
    ('560102', 'Bengaluru', 12.9082, 77.6476),
    ('560103', 'Bengaluru', 12.926, 77.6762),
    ('560104', 'Bengaluru', 12.96, 77.594);

insert into public.partners (id, name, about, line1, line2, city, pincode, latitude, longitude,
                            turnaround_hours, is_open, auto_schedule, image_url, image_alt,
                            rating, review_count) values
    ('1001', 'SparkleWash Express', 'A neighbourhood laundry running since 2015, with same-day turnaround on wash and fold.', '12, MG Road', 'Sector 5', 'Bengaluru', '560103', 12.932753, 77.678722, 24, true, false, 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80', 'Front-loading washing machines in a bright laundromat', 4.9, 234),
    ('1002', 'CleanFold Laundry', 'Straightforward everyday laundry at everyday prices.', '45, Park Street', 'Block B', 'Bengaluru', '560103', 12.916664, 77.68173, 48, true, false, 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=600&q=80', 'A person holding a stack of folded knitwear', 4.7, 189),
    ('1003', 'Royal Dry Cleaners', 'Specialists in occasion wear, with in-house finishing for suits and sarees.', '8, Civil Lines', 'Main Market', 'Bengaluru', '560102', 12.914937, 77.635628, 24, true, false, 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=600&q=80', 'A laundry basket filled with clothes', 4.8, 312),
    ('1004', 'FreshPress Studio', 'A pressing-first studio: everything comes back on a hanger, crease sharp.', '22, Station Road', '', 'Bengaluru', '560102', 12.913083, 77.666294, 36, false, false, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=600&q=80', 'A steam iron pressing a shirt', 4.6, 98),
    ('1005', 'AquaClean Services', 'Plant-based detergents and a water reclamation loop, without a premium for it.', '67, Green Avenue', 'Phase 2', 'Bengaluru', '560103', 12.911573, 77.65506, 24, true, false, 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=600&q=80', 'Clothes tumbling inside a washing machine drum', 4.5, 156),
    ('1006', 'QuickWash Hub', 'A high-volume plant. Bulk loads welcome, priced by the piece all the same.', '101, Industrial Area', '', 'Bengaluru', '560104', 12.950168, 77.621718, 48, true, false, 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=600&q=80', 'Industrial washing machines lined up in a row', 4.4, 73);

insert into public.partner_tags (partner_id, tag) values
    ('1001', 'eco-friendly'),
    ('1001', 'free-pickup'),
    ('1002', 'budget-friendly'),
    ('1003', 'premium'),
    ('1003', 'same-day'),
    ('1004', 'free-pickup'),
    ('1004', 'iron-fold'),
    ('1005', 'eco-friendly'),
    ('1005', 'premium'),
    ('1006', 'budget-friendly'),
    ('1006', 'bulk-discount');

-- weekday 0 = Sunday. A null pair is a day the partner is shut.
insert into public.partner_hours (partner_id, weekday, opens_at, closes_at) values
    ('1001', 0, null, null),
    ('1001', 1, '08:00', '20:00'),
    ('1001', 2, '08:00', '20:00'),
    ('1001', 3, '08:00', '20:00'),
    ('1001', 4, '08:00', '20:00'),
    ('1001', 5, '08:00', '20:00'),
    ('1001', 6, '09:00', '18:00'),
    ('1002', 0, null, null),
    ('1002', 1, '08:00', '20:00'),
    ('1002', 2, '08:00', '20:00'),
    ('1002', 3, '08:00', '20:00'),
    ('1002', 4, '08:00', '20:00'),
    ('1002', 5, '08:00', '20:00'),
    ('1002', 6, '09:00', '18:00'),
    ('1003', 0, null, null),
    ('1003', 1, '08:00', '20:00'),
    ('1003', 2, '08:00', '20:00'),
    ('1003', 3, '08:00', '20:00'),
    ('1003', 4, '08:00', '20:00'),
    ('1003', 5, '08:00', '20:00'),
    ('1003', 6, '09:00', '18:00'),
    ('1004', 0, null, null),
    ('1004', 1, '08:00', '20:00'),
    ('1004', 2, '08:00', '20:00'),
    ('1004', 3, '08:00', '20:00'),
    ('1004', 4, '08:00', '20:00'),
    ('1004', 5, '08:00', '20:00'),
    ('1004', 6, '09:00', '18:00'),
    ('1005', 0, null, null),
    ('1005', 1, '08:00', '20:00'),
    ('1005', 2, '08:00', '20:00'),
    ('1005', 3, '08:00', '20:00'),
    ('1005', 4, '08:00', '20:00'),
    ('1005', 5, '08:00', '20:00'),
    ('1005', 6, '09:00', '18:00'),
    ('1006', 0, '07:00', '19:00'),
    ('1006', 1, '07:00', '21:00'),
    ('1006', 2, '07:00', '21:00'),
    ('1006', 3, '07:00', '21:00'),
    ('1006', 4, '07:00', '21:00'),
    ('1006', 5, '07:00', '21:00'),
    ('1006', 6, '07:00', '19:00');

insert into public.catalog_categories (id, partner_id, service, name, position) values
    ('cat_1001_wash-fold', '1001', 'wash-fold', 'Wash & Fold', 0),
    ('cat_1001_wash-iron', '1001', 'wash-iron', 'Wash & Iron', 1),
    ('cat_1001_dry-cleaning', '1001', 'dry-cleaning', 'Dry Cleaning', 2),
    ('cat_1002_wash-fold', '1002', 'wash-fold', 'Wash & Fold', 0),
    ('cat_1002_wash-iron', '1002', 'wash-iron', 'Wash & Iron', 1),
    ('cat_1003_dry-cleaning', '1003', 'dry-cleaning', 'Express Dry Clean', 0),
    ('cat_1003_premium-care', '1003', 'premium-care', 'Luxury & Couture', 1),
    ('cat_1004_wash-fold', '1004', 'wash-fold', 'Wash & Fold', 0),
    ('cat_1004_wash-iron', '1004', 'wash-iron', 'Wash & Iron', 1),
    ('cat_1005_wash-fold', '1005', 'wash-fold', 'Wash & Fold', 0),
    ('cat_1005_dry-cleaning', '1005', 'dry-cleaning', 'Dry Cleaning', 1),
    ('cat_1005_premium-care', '1005', 'premium-care', 'Delicates & Couture', 2),
    ('cat_1006_wash-fold', '1006', 'wash-fold', 'Wash & Fold', 0);

insert into public.catalog_items (id, category_id, name, description, price, currency, unit, icon_key, position) values
    ('itm_1001_wf-shirt', 'cat_1001_wash-fold', 'Shirt / T-shirt', 'Machine washed with premium detergent, neatly folded', 2000, 'INR', 'piece', 'shirt', 0),
    ('itm_1001_wf-trousers', 'cat_1001_wash-fold', 'Trousers / Jeans', 'Machine washed and folded, ready to wear', 3000, 'INR', 'piece', 'box', 1),
    ('itm_1001_wf-bedsheet', 'cat_1001_wash-fold', 'Bedsheet', 'Single or double, washed and pressed flat', 6000, 'INR', 'piece', 'bed', 2),
    ('itm_1001_wf-towel', 'cat_1001_wash-fold', 'Towel', 'Washed on a hot cycle and tumble dried', 2500, 'INR', 'piece', 'sparkles', 3),
    ('itm_1001_wi-shirt', 'cat_1001_wash-iron', 'Shirt / T-shirt', 'Washed, then professionally pressed', 3000, 'INR', 'piece', 'shirt', 0),
    ('itm_1001_wi-trousers', 'cat_1001_wash-iron', 'Trousers / Jeans', 'Washed and pressed with a sharp crease', 4000, 'INR', 'piece', 'box', 1),
    ('itm_1001_wi-kurta', 'cat_1001_wash-iron', 'Kurta / Ethnic Wear', 'Gentle wash and press for everyday ethnic wear', 4500, 'INR', 'piece', 'star', 2),
    ('itm_1001_dc-jacket', 'cat_1001_dry-cleaning', 'Jacket / Coat', 'Solvent cleaned and finished on a form press', 19900, 'INR', 'piece', 'box', 0),
    ('itm_1001_dc-suit', 'cat_1001_dry-cleaning', 'Suit (2 piece)', 'Jacket and trousers cleaned together', 34900, 'INR', 'piece', 'crown', 1),
    ('itm_1001_dc-saree', 'cat_1001_dry-cleaning', 'Saree', 'Delicate handling for silk and embroidery', 24900, 'INR', 'piece', 'star', 2),
    ('itm_1002_wf-shirt', 'cat_1002_wash-fold', 'Shirt / T-shirt', 'Machine washed with premium detergent, neatly folded', 1500, 'INR', 'piece', 'shirt', 0),
    ('itm_1002_wf-trousers', 'cat_1002_wash-fold', 'Trousers / Jeans', 'Machine washed and folded, ready to wear', 2200, 'INR', 'piece', 'box', 1),
    ('itm_1002_wf-bedsheet', 'cat_1002_wash-fold', 'Bedsheet', 'Single or double, washed and pressed flat', 4500, 'INR', 'piece', 'bed', 2),
    ('itm_1002_wf-towel', 'cat_1002_wash-fold', 'Towel', 'Washed on a hot cycle and tumble dried', 1900, 'INR', 'piece', 'sparkles', 3),
    ('itm_1002_wi-shirt', 'cat_1002_wash-iron', 'Shirt / T-shirt', 'Washed, then professionally pressed', 2200, 'INR', 'piece', 'shirt', 0),
    ('itm_1002_wi-trousers', 'cat_1002_wash-iron', 'Trousers / Jeans', 'Washed and pressed with a sharp crease', 3000, 'INR', 'piece', 'box', 1),
    ('itm_1002_wi-kurta', 'cat_1002_wash-iron', 'Kurta / Ethnic Wear', 'Gentle wash and press for everyday ethnic wear', 3400, 'INR', 'piece', 'star', 2),
    ('itm_1003_dc-jacket', 'cat_1003_dry-cleaning', 'Jacket / Coat', 'Solvent cleaned and finished on a form press', 23900, 'INR', 'piece', 'box', 0),
    ('itm_1003_dc-suit', 'cat_1003_dry-cleaning', 'Suit (2 piece)', 'Jacket and trousers cleaned together', 41900, 'INR', 'piece', 'crown', 1),
    ('itm_1003_dc-saree', 'cat_1003_dry-cleaning', 'Saree', 'Delicate handling for silk and embroidery', 29900, 'INR', 'piece', 'star', 2),
    ('itm_1003_pc-saree', 'cat_1003_premium-care', 'Silk Saree', 'Hand finished, starch and fold to order', 41900, 'INR', 'piece', 'star', 0),
    ('itm_1003_pc-lehenga', 'cat_1003_premium-care', 'Lehenga', 'Bead and zari safe cleaning, individually bagged', 71900, 'INR', 'piece', 'crown', 1),
    ('itm_1003_pc-sherwani', 'cat_1003_premium-care', 'Sherwani', 'Dry cleaned and form pressed', 59900, 'INR', 'piece', 'crown', 2),
    ('itm_1003_pc-leather', 'cat_1003_premium-care', 'Leather Jacket', 'Specialist clean and conditioning', 53900, 'INR', 'piece', 'sparkles', 3),
    ('itm_1004_wf-shirt', 'cat_1004_wash-fold', 'Shirt / T-shirt', 'Machine washed with premium detergent, neatly folded', 1800, 'INR', 'piece', 'shirt', 0),
    ('itm_1004_wf-trousers', 'cat_1004_wash-fold', 'Trousers / Jeans', 'Machine washed and folded, ready to wear', 2700, 'INR', 'piece', 'box', 1),
    ('itm_1004_wf-bedsheet', 'cat_1004_wash-fold', 'Bedsheet', 'Single or double, washed and pressed flat', 5400, 'INR', 'piece', 'bed', 2),
    ('itm_1004_wf-towel', 'cat_1004_wash-fold', 'Towel', 'Washed on a hot cycle and tumble dried', 2200, 'INR', 'piece', 'sparkles', 3),
    ('itm_1004_wi-shirt', 'cat_1004_wash-iron', 'Shirt / T-shirt', 'Washed, then professionally pressed', 2700, 'INR', 'piece', 'shirt', 0),
    ('itm_1004_wi-trousers', 'cat_1004_wash-iron', 'Trousers / Jeans', 'Washed and pressed with a sharp crease', 3600, 'INR', 'piece', 'box', 1),
    ('itm_1004_wi-kurta', 'cat_1004_wash-iron', 'Kurta / Ethnic Wear', 'Gentle wash and press for everyday ethnic wear', 4000, 'INR', 'piece', 'star', 2),
    ('itm_1005_wf-shirt', 'cat_1005_wash-fold', 'Shirt / T-shirt', 'Machine washed with premium detergent, neatly folded', 2500, 'INR', 'piece', 'shirt', 0),
    ('itm_1005_wf-trousers', 'cat_1005_wash-fold', 'Trousers / Jeans', 'Machine washed and folded, ready to wear', 3800, 'INR', 'piece', 'box', 1),
    ('itm_1005_wf-bedsheet', 'cat_1005_wash-fold', 'Bedsheet', 'Single or double, washed and pressed flat', 7500, 'INR', 'piece', 'bed', 2),
    ('itm_1005_wf-towel', 'cat_1005_wash-fold', 'Towel', 'Washed on a hot cycle and tumble dried', 3100, 'INR', 'piece', 'sparkles', 3),
    ('itm_1005_dc-jacket', 'cat_1005_dry-cleaning', 'Jacket / Coat', 'Solvent cleaned and finished on a form press', 24900, 'INR', 'piece', 'box', 0),
    ('itm_1005_dc-suit', 'cat_1005_dry-cleaning', 'Suit (2 piece)', 'Jacket and trousers cleaned together', 43600, 'INR', 'piece', 'crown', 1),
    ('itm_1005_dc-saree', 'cat_1005_dry-cleaning', 'Saree', 'Delicate handling for silk and embroidery', 31100, 'INR', 'piece', 'star', 2),
    ('itm_1005_pc-saree', 'cat_1005_premium-care', 'Silk Saree', 'Hand finished, starch and fold to order', 43600, 'INR', 'piece', 'star', 0),
    ('itm_1005_pc-lehenga', 'cat_1005_premium-care', 'Lehenga', 'Bead and zari safe cleaning, individually bagged', 74900, 'INR', 'piece', 'crown', 1),
    ('itm_1005_pc-sherwani', 'cat_1005_premium-care', 'Sherwani', 'Dry cleaned and form pressed', 62400, 'INR', 'piece', 'crown', 2),
    ('itm_1005_pc-leather', 'cat_1005_premium-care', 'Leather Jacket', 'Specialist clean and conditioning', 56100, 'INR', 'piece', 'sparkles', 3),
    ('itm_1006_wf-shirt', 'cat_1006_wash-fold', 'Shirt / T-shirt', 'Machine washed with premium detergent, neatly folded', 1200, 'INR', 'piece', 'shirt', 0),
    ('itm_1006_wf-trousers', 'cat_1006_wash-fold', 'Trousers / Jeans', 'Machine washed and folded, ready to wear', 1800, 'INR', 'piece', 'box', 1),
    ('itm_1006_wf-bedsheet', 'cat_1006_wash-fold', 'Bedsheet', 'Single or double, washed and pressed flat', 3600, 'INR', 'piece', 'bed', 2),
    ('itm_1006_wf-towel', 'cat_1006_wash-fold', 'Towel', 'Washed on a hot cycle and tumble dried', 1500, 'INR', 'piece', 'sparkles', 3);

-- Two-hour slots for the next fortnight, from each partner's opening hours.
select public.generate_slots(id, timezone('Asia/Kolkata', now())::date, 14)
from public.partners;
