import path from 'node:path';
import { test, expect } from '@fixtures/authenticated.fixture';
import { CommercialContractApplicationPage } from '@pages/commercial-contract-application.page';
import { createCommercialContractData } from '@data/dynamic/commercial-contract-data';
import {
  reserveNextCommercialContractNumber,
  saveCommercialContractRecord,
} from '@utils/commercial-contract-record';

test.describe('Creación de contrato empresa', () => {
  test(
    'Crear y enviar solicitud de acreditación de contrato comercial en División Salvador',
    { tag: ['@critical', '@regression'] },
    async ({ commercialContractRequestsPage }) => {
      test.setTimeout(300_000);

      const data = await test.step('Preparar la solicitud y reservar el contrato', async () => {
        await commercialContractRequestsPage.open();
        const existingNumbers =
          await commercialContractRequestsPage.visibleAutomationContractNumbers();
        const contractNumber = await reserveNextCommercialContractNumber(existingNumbers);
        return createCommercialContractData(contractNumber);
      });

      const application = await test.step(
        'Iniciar solicitud de acreditación de contrato comercial',
        async () => {
          const contractPage =
            await commercialContractRequestsPage.startCommercialContractRequest();
          return new CommercialContractApplicationPage(contractPage);
        },
        { params: { tipoSolicitud: 'Contrato comercial' } },
      );

      await test.step(
        'Seleccionar División Salvador como centro de trabajo',
        async () => {
          await application.selectSalvador();
        },
        { params: { centroTrabajo: 'División Salvador' } },
      );

      await test.step(
        'Completar datos contractuales y jornada laboral',
        async () => {
          await application.completeContractualData(data);
        },
        {
          params: {
            contrato: data.contractNumber,
            rubro: data.contractCategory,
            gerencia: data.management,
            areaTrabajo: data.workArea,
            fechaInicio: data.startDate,
            fechaTermino: data.endDate,
            jornada: 'Ordinaria 10x5',
          },
        },
      );

      await test.step(
        'Completar responsables y autorización de retiro',
        async () => {
          await application.completePersonalData(data);
        },
        { subtitle: 'Datos personales sintéticos protegidos en el reporte' },
      );

      await test.step(
        'Cargar los documentos obligatorios',
        async () => {
          const pdfPath = path.resolve('test-assets/documents/CentroEjecutivo.pdf');
          const imagePath = path.resolve('test-assets/images/imagenMuestra.jpg');
          const uploadedDocuments = await application.uploadMandatoryDocuments(pdfPath, imagePath);
          expect(uploadedDocuments.length).toBeGreaterThan(0);
        },
        { params: { documentosEsperados: 4 } },
      );

      const requestNumber = await test.step(
        'Guardar y enviar la solicitud',
        async () => {
          const submittedRequestNumber = await application.submit(data);
          expect(submittedRequestNumber).toMatch(/^SCE-CONTRATO-\d+$/);
          await saveCommercialContractRecord(data.contractNumber, submittedRequestNumber);
          return submittedRequestNumber;
        },
        { params: { contrato: data.contractNumber, estadoEsperado: 'ENVIADO' } },
      );

      test.info().annotations.push({
        type: 'evidencia',
        description: `Contrato ${data.contractNumber} · Solicitud ${requestNumber} · Estado ENVIADO`,
      });
    },
  );
});
