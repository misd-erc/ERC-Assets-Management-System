using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.ResponseModels.Account;
using System;
using System.Collections.Generic;

namespace PortalDB.Models.ResponseModels.PTA
{
    public class PTAMovementDetailResponseModel
    {
        public long Id { get; set; }
        public long? PTAId { get; set; }
        public DateTime? DateAssigned { get; set; }
        public string? PTRITRNumber { get; set; }
        public string? RRPPERRSPNumber { get; set; }
        public string? PARICSNumber { get; set; }
        
        // Employee array: [0] = From Employee (previous holder), [1] = To Employee (current holder)
        public List<EmployeeMovementInfoModel>? Employee { get; set; }
        
        // Transfer destination
        public TblOffice? Office { get; set; }
        public TblDivision? Division { get; set; }
        
        // Items transferred
        public List<PTAMovementItemModel>? Items { get; set; }
        
        // Remarks and status
        public string? Remarks { get; set; }
        public string? Status { get; set; }
        public bool IsActive { get; set; }
        public bool IsCurrent { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Simplified employee info for movement display
    /// </summary>
    public class EmployeeMovementInfoModel
    {
        public long Id { get; set; }
        public string? FullName { get; set; }
        public string? EmployeeIdOriginal { get; set; }
        public string? EmployeeType { get; set; } // "Plantilla" or "Non-Plantilla"
        public TblPosition? Position { get; set; }
        public TblOffice? Office { get; set; }
        public TblDivision? Division { get; set; }
    }

    /// <summary>
    /// PTA item details for movement
    /// </summary>
    public class PTAMovementItemModel
    {
        public long Id { get; set; }
        public string? PropertyNumber { get; set; }
        public string? Description { get; set; }
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public string? SerialNumber { get; set; }
        public string? Category { get; set; }
        public string? UnitOfMeasurement { get; set; }
        public long? UnitValue { get; set; }
        public DateTime? DateAcquired { get; set; }
        public string? Group { get; set; } // SE or PPE
    }
}
