using PortalTools.Services.GetEditTools.ASSET.PPE;
using PortalTools.Services.GetEditTools.DBO.Account;
using PortalTools.Services.GetEditTools.DBO.Notification;
using PortalTools.Services.GetEditTools.DBO.Office;
using PortalTools.Services.GetEditTools.DBO.Storage;
using PortalTools.Services.GetEditTools.LOG;

namespace PortalTools.Composition;

public class PortalGetTools : IPortalGetTools
{
    public PortalGetTools(
        AccountGetTools account,
        OfficeGetTools office,
        LogGetTools log,
        StorageGetTools storage,
        NotificationGetTools notification,
        PPEGetTools ppe
    )
    {
        Account = account;
        Office = office;
        Storage = storage;
        Log = log;
        Notification = notification;
        PPE = ppe;
    }

    public AccountGetTools Account { get; }
    public OfficeGetTools Office { get; }
    public StorageGetTools Storage { get; }
    public LogGetTools Log { get; }
    public NotificationGetTools Notification { get; }
    public PPEGetTools PPE { get; }

}