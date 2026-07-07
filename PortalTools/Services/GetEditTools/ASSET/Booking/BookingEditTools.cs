using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.Booking;
using PortalDB.Services;
using PortalTools.Composition;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Services.GetEditTools.ASSET.Booking
{
    public class BookingEditTools
    {

        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;

        public BookingEditTools(DbContextOptions<PortalDbContext> options, IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
        }

        public async Task<long> EditTblAssetBookingItemAsync(TblAssetBookingItem model, long actionBySystemUserId, PortalDbContext context, bool isBatch = false)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblAssetBookingItem? existingBookingItem = null;

                if (isInsert)
                {
                    await context.TblAssetBookingItems.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingBookingItem = await _getTools.Booking.GetTblAssetBookingItemAsync(model.Id, context);

                    if (existingBookingItem == null)
                        return 0;

                    model.Id = existingBookingItem.Id;

                    await context.TblAssetBookingItems.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Group, model.Group)
                            .SetProperty(x => x.SupplyIARId, model.SupplyIARId)
                            .SetProperty(x => x.DeliveryRecordId, model.DeliveryRecordId)
                            .SetProperty(x => x.DeliveryRecordItemId, model.DeliveryRecordItemId)
                            .SetProperty(x => x.UnitSequence, model.UnitSequence)
                            .SetProperty(x => x.CategoryId, model.CategoryId)
                            .SetProperty(x => x.CodeEncrypted, model.CodeEncrypted)
                            .SetProperty(x => x.DescriptionEncrypted, model.DescriptionEncrypted)
                            .SetProperty(x => x.SpecificationEncrypted, model.SpecificationEncrypted)
                            .SetProperty(x => x.MeasurementUnitId, model.MeasurementUnitId)
                            .SetProperty(x => x.Quantity, model.Quantity)
                            .SetProperty(x => x.UnitCost, model.UnitCost)
                            .SetProperty(x => x.ReorderPoint, model.ReorderPoint)
                            .SetProperty(x => x.StorageLocationId, model.StorageLocationId)
                            .SetProperty(x => x.VendorId, model.VendorId)
                            .SetProperty(x => x.DeliveryDate, model.DeliveryDate)
                            .SetProperty(x => x.SuggestedPropertyNumberEncrypted, model.SuggestedPropertyNumberEncrypted)
                            .SetProperty(x => x.Status, model.Status)
                            .SetProperty(x => x.IsActive, model.IsActive));
                }

                if (!isBatch)
                    await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} an Asset Booking Item", actionBy: actionBySystemUserId,
                        linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingBookingItem!, model, nameof(TblAssetBookingItem), actionBySystemUserId, isInsert ? "Insert" : "Update"));

                return isInsert ? model.Id : existingBookingItem.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(BookingEditTools));
                throw;
            }
        }

        /// <summary>
        /// Conditionally transitions a staged item to Booked, guarded by Status == Pending so a raced
        /// double-book/cancel is detected via the returned affected-row count instead of a lock.
        /// </summary>
        public async Task<int> MarkBookedAsync(long id, long? finalizedSupplyItemId, long? finalizedPTAId, long actionBySystemUserId, PortalDbContext context)
        {
            int rowsAffected = await context.TblAssetBookingItems
                .Where(x => x.Id == id && x.Status == TblAssetBookingItem.STATUS_PENDING)
                .ExecuteUpdateAsync(u => u
                    .SetProperty(x => x.Status, TblAssetBookingItem.STATUS_BOOKED)
                    .SetProperty(x => x.BookedAt, DateTime.UtcNow)
                    .SetProperty(x => x.BookedBySystemUserId, actionBySystemUserId)
                    .SetProperty(x => x.FinalizedSupplyItemId, finalizedSupplyItemId)
                    .SetProperty(x => x.FinalizedPTAId, finalizedPTAId));

            if (rowsAffected > 0)
                await AuditTrailTool.LogActivityAsync(_options, "Booked an Asset Booking Item", actionBy: actionBySystemUserId);

            return rowsAffected;
        }

        /// <summary>
        /// Conditionally cancels a still-pending staged item, guarded the same way as MarkBookedAsync.
        /// </summary>
        public async Task<int> CancelTblAssetBookingItemAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            int rowsAffected = await context.TblAssetBookingItems
                .Where(x => x.Id == id && x.Status == TblAssetBookingItem.STATUS_PENDING)
                .ExecuteUpdateAsync(u => u.SetProperty(x => x.Status, TblAssetBookingItem.STATUS_CANCELLED));

            if (rowsAffected > 0)
                await AuditTrailTool.LogActivityAsync(_options, "Cancelled an Asset Booking Item", actionBy: actionBySystemUserId);

            return rowsAffected;
        }

        /// <summary>
        /// Bulk-cancels still-pending staged items for an IAR that was un-approved, leaving already-Booked
        /// rows untouched (matches the system's one-way-approval philosophy).
        /// </summary>
        public async Task<int> CancelPendingBySupplyIARIdAsync(long supplyIARId, PortalDbContext context)
        {
            return await context.TblAssetBookingItems
                .Where(x => x.SupplyIARId == supplyIARId && x.Status == TblAssetBookingItem.STATUS_PENDING)
                .ExecuteUpdateAsync(u => u.SetProperty(x => x.Status, TblAssetBookingItem.STATUS_CANCELLED));
        }
    }
}
