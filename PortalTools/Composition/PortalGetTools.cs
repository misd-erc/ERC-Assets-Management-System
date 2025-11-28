using PortalTools.Services.GetEditTools.ASSET.PTA;
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
        PTAGetTools pta
    )
    {
        Account = account;
        Office = office;
        Storage = storage;
        Log = log;
        Notification = notification;
        PTA = pta;
    }

    public AccountGetTools Account { get; }
    public OfficeGetTools Office { get; }
    public StorageGetTools Storage { get; }
    public LogGetTools Log { get; }
    public NotificationGetTools Notification { get; }
    public PTAGetTools PTA { get; }

}