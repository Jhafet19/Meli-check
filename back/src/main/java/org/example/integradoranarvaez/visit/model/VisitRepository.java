package org.example.integradoranarvaez.visit.model;

import org.example.integradoranarvaez.visit_status.VisitStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VisitRepository extends JpaRepository<VisitEntity, Long> {

    List<VisitEntity> findAllByDealer_Id(Long dealerId);

    List<VisitEntity> findAllByDealer_IdAndStore_IdAndCheckOutAtIsNull(Long dealerId, Long storeId);

    List<VisitEntity> findAllByDealer_IdAndVisitDate(Long dealerId, LocalDate visitDate);

    List<VisitEntity> findAllByStore_IdAndVisitDate(Long storeId, LocalDate visitDate);

    List<VisitEntity> findAllByDealer_IdAndStore_IdAndVisitDate(Long dealerId, Long storeId, LocalDate visitDate);

    List<VisitEntity> findAllByDealer_IdAndStatus_CodeAndVisitDate(Long dealerId, VisitStatusEnum statusCode, LocalDate visitDate);

    @Query("SELECT v FROM VisitEntity v WHERE " +
            "(:dealerId IS NULL OR v.dealer.id = :dealerId) AND " +
            "(:storeId IS NULL OR v.store.id = :storeId) AND " +
            "(:statusCode IS NULL OR v.status.code = :statusCode) AND " +
            "(:startDate IS NULL OR v.visitDate >= :startDate) AND " +
            "(:endDate IS NULL OR v.visitDate <= :endDate) AND " +
            "v.isActive = true")
    List<VisitEntity> findByFilters(@Param("dealerId") Long dealerId,
                                    @Param("storeId") Long storeId,
                                    @Param("statusCode") VisitStatusEnum statusCode,
                                    @Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate);

    @Query("SELECT v FROM VisitEntity v WHERE " +
            "v.dealer.id = :dealerId AND " +
            "v.checkOutAt IS NULL AND " +
            "v.status.code IN (org.example.integradoranarvaez.visit_status.VisitStatusEnum.PLANNED, " +
            "org.example.integradoranarvaez.visit_status.VisitStatusEnum.CHECKED_IN)")
    List<VisitEntity> findOpenVisitsByDealer(@Param("dealerId") Long dealerId);

    @Query("SELECT COUNT(v) > 0 FROM VisitEntity v WHERE " +
            "v.dealer.id = :dealerId AND " +
            "v.store.id = :storeId AND " +
            "v.checkOutAt IS NULL AND " +
            "v.status.code = org.example.integradoranarvaez.visit_status.VisitStatusEnum.CHECKED_IN")
    boolean existsOpenVisit(@Param("dealerId") Long dealerId, @Param("storeId") Long storeId);

    @Query("SELECT v FROM VisitEntity v WHERE " +
            "v.store.qrCode = :qrCode AND " +
            "v.dealer.id = :dealerId AND " +
            "v.visitDate = CURRENT_DATE AND " +
            "v.status.code = org.example.integradoranarvaez.visit_status.VisitStatusEnum.PLANNED " +
            "ORDER BY v.createdAt ASC")
    List<VisitEntity> findPlannedVisitsByQrAndDealer(@Param("qrCode") String qrCode,
                                                     @Param("dealerId") Long dealerId);

    @Query("SELECT v FROM VisitEntity v WHERE " +
            "v.assignment.id = :assignmentId")
    List<VisitEntity> findAllByAssignmentId(@Param("assignmentId") Long assignmentId);

    @Query("SELECT COUNT(v) FROM VisitEntity v WHERE " +
            "v.dealer.id = :dealerId AND " +
            "v.visitDate = :date AND " +
            // Usar el valor del enum directamente
            "v.status.code = org.example.integradoranarvaez.visit_status.VisitStatusEnum.COMPLETED")
    Integer countCompletedVisitsByDealerAndDate(@Param("dealerId") Long dealerId,
                                                @Param("date") LocalDate date);

    @Query("SELECT v FROM VisitEntity v WHERE " +
            "v.dealer.id = :dealerId AND " +
            "v.store.id = :storeId AND " +
            "v.visitDate = :visitDate AND " +
            "v.status.id = :statusId")
    Optional<VisitEntity> findByDealerStoreAndDateAndStatus(@Param("dealerId") Long dealerId,
                                                            @Param("storeId") Long storeId,
                                                            @Param("visitDate") LocalDate visitDate,
                                                            @Param("statusId") Long statusId);
}