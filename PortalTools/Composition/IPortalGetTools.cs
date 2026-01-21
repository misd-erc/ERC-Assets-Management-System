using PortalTools.Services.GetEditTools.ASSET.PTA;
using PortalTools.Services.GetEditTools.ASSET.Supply;
using PortalTools.Services.GetEditTools.DBO.Account;
using PortalTools.Services.GetEditTools.DBO.Notification;
using PortalTools.Services.GetEditTools.DBO.Office;
using PortalTools.Services.GetEditTools.DBO.Storage;
using PortalTools.Services.GetEditTools.LOG;

namespace PortalTools.Composition;

public interface IPortalGetTools
{
    AccountGetTools Account { get; }
    OfficeGetTools Office { get; }
    StorageGetTools Storage { get; }
    LogGetTools Log { get; }
    NotificationGetTools Notification { get; }
    PTAGetTools PTA { get; }
    SupplyGetTools Supply { get; }
}
