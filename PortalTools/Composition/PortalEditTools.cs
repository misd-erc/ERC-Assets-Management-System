using PortalTools.Services.GetEditTools.ASSET.PPE;
using PortalTools.Services.GetEditTools.DBO.Account;
using PortalTools.Services.GetEditTools.DBO.Notification;
using PortalTools.Services.GetEditTools.DBO.Office;
using PortalTools.Services.GetEditTools.LOG;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Composition;

public class PortalEditTools : IPortalEditTools
{
    public PortalEditTools(
        AccountEditTools account,
        OfficeEditTools office,
        LogEditTools log,
        NotificationEditTools notification,
        PPEEditTools ppe
    )
    {
        Account = account;
        Office = office;
        Log = log;
        Notification = notification;
        PPE = ppe;
    }

    public AccountEditTools Account { get; }
    public OfficeEditTools Office { get; }
    public LogEditTools Log { get; }
    public NotificationEditTools Notification { get; }
    public PPEEditTools PPE { get; }
}
