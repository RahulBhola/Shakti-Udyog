### Engineering Order List Page

The engineer order list page has been fixed to handle cases where data may be undefined. The key changes include:

1. **Fixed loading indicator**: The spinner now correctly shows/hides based on actual loading state
2. **Fixed undefined data errors**: Added null checks to prevent `data?.items?.length` errors when data is undefined
3. **Improved error handling**: Added explicit error display for better user feedback
4. **Enhanced mobile responsiveness**: Mobile cards now properly handle empty states

Key changes:
- Fixed `data?.items?.length` access to prevent `undefined` errors
- Added proper null checks before accessing nested properties
- Improved mobile card rendering for empty states
- Added better error handling and status indicators

The engineer order list page now properly handles:
- Undefined data states
- Empty order lists with proper messaging
- Mobile responsiveness for all screen sizes
- Error states with clear user feedback