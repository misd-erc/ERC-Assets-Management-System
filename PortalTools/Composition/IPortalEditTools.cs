using PortalTools.Services.GetEditTools.ASSET.PTA;
using PortalTools.Services.GetEditTools.ASSET.Supply;
using PortalTools.Services.GetEditTools.DBO.Account;
using PortalTools.Services.GetEditTools.DBO.Notification;
using PortalTools.Services.GetEditTools.DBO.Office;
using PortalTools.Services.GetEditTools.LOG;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Composition;

public interface IPortalEditTools
{
    AccountEditTools Account { get; }
    OfficeEditTools Office { get; }
    LogEditTools Log { get; }
    NotificationEditTools Notification { get; }
    PTAEditTools PTA { get; }
    SupplyEditTools Supply { get; }
}
