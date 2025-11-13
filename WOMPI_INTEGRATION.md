# Integración de Wompi - FCM INSTITUTE

## 📋 Resumen

Se ha implementado un sistema completo para gestionar inscripciones y pagos usando Wompi como pasarela de pago.

## ✅ Archivos Creados/Modificados

### 1. **Nueva Página: `src/pages/mis-inscripciones.astro`**
   - Lista todas las inscripciones del usuario autenticado
   - Muestra información completa de cada programa inscrito
   - Botón "Generar Link de Pago" para cada inscripción pendiente
   - Estados de pago: Pendiente, Completado, Fallido
   - Integración con modales personalizados
   - Responsive design

### 2. **Archivo Actualizado: `src/lib/auth.ts`**
   - Nuevos tipos TypeScript:
     - `Pago`: Representa un pago con información de Wompi
     - `Inscripcion`: Representa una inscripción completa
   - Nueva función: `getInscripciones()` - Obtiene todas las inscripciones del usuario
   - Nueva función: `generarLinkPago(pagoId)` - Genera link de pago con Wompi

## 🔧 Integración Backend Requerida

Para que esta integración funcione completamente, necesitas implementar el siguiente endpoint en tu backend:

### Endpoint: `POST /api/pagos/:pagoId/link-pago`

**Descripción**: Genera un link de pago de Wompi para una inscripción específica

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Respuesta Exitosa (200)**:
```json
{
  "url": "https://checkout.wompi.co/l/{transaction_id}"
}
```

**Ejemplo de Implementación Backend (Node.js/NestJS)**:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import crypto from 'crypto';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,
    @InjectRepository(Inscripcion)
    private inscripcionRepository: Repository<Inscripcion>,
  ) {}

  async generarLinkPago(pagoId: string, userId: string) {
    // 1. Verificar que el pago existe y pertenece al usuario
    const pago = await this.pagoRepository.findOne({
      where: { id: pagoId },
      relations: ['inscripcion', 'inscripcion.user', 'inscripcion.programa'],
    });

    if (!pago || pago.inscripcion.user.id !== userId) {
      throw new UnauthorizedException('Pago no encontrado');
    }

    if (pago.estado !== 'Pendiente') {
      throw new BadRequestException('Este pago ya fue procesado');
    }

    // 2. Preparar datos para Wompi
    const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY; // Tu llave pública de Wompi
    const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY; // Tu llave privada de Wompi
    const WOMPI_EVENTS_KEY = process.env.WOMPI_EVENTS_KEY; // Tu llave de eventos
    
    const amountInCents = Math.round(parseFloat(pago.monto) * 100); // Convertir a centavos
    const currency = 'COP';
    const reference = pago.referenciaPago || `INS-${pago.inscripcion.id}`;
    
    // 3. Generar signature (integridad)
    const concatenatedString = `${reference}${amountInCents}${currency}${WOMPI_EVENTS_KEY}`;
    const signature = crypto
      .createHash('sha256')
      .update(concatenatedString)
      .digest('hex');

    // 4. Crear transacción en Wompi
    const wompiData = {
      public_key: WOMPI_PUBLIC_KEY,
      currency: currency,
      amount_in_cents: amountInCents,
      reference: reference,
      signature: {
        integrity: signature,
      },
      redirect_url: `${process.env.FRONTEND_URL}/pago-confirmacion`, // URL de retorno
      customer_data: {
        email: pago.inscripcion.user.email,
        full_name: `${pago.inscripcion.user.firstName} ${pago.inscripcion.user.lastName}`,
        phone_number: pago.inscripcion.user.telephone || '',
      },
      shipping_address: {
        address_line_1: pago.inscripcion.user.address || 'N/A',
        country: 'CO',
        city: 'Montería',
        phone_number: pago.inscripcion.user.telephone || '',
      },
    };

    // 5. Hacer petición a Wompi para crear transacción
    const response = await fetch('https://production.wompi.co/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
      },
      body: JSON.stringify(wompiData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new InternalServerErrorException('Error al crear transacción en Wompi');
    }

    // 6. Guardar información de la transacción
    await this.pagoRepository.update(pagoId, {
      wompi_transaccion: result.data.id,
      raw_response: result,
    });

    // 7. Retornar URL de pago
    return {
      url: result.data.payment_link.permalink,
      transactionId: result.data.id,
    };
  }

  // Webhook para recibir notificaciones de Wompi
  async handleWebhook(event: any) {
    const transaction = event.data.transaction;
    
    // Buscar el pago por wompi_transaccion
    const pago = await this.pagoRepository.findOne({
      where: { wompi_transaccion: transaction.id },
    });

    if (!pago) {
      console.error('Pago no encontrado para transacción:', transaction.id);
      return;
    }

    // Actualizar estado según el resultado
    if (transaction.status === 'APPROVED') {
      await this.pagoRepository.update(pago.id, {
        estado: 'Completado',
        fechaPago: new Date(),
        metodo: transaction.payment_method_type,
        raw_response: transaction,
      });
    } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
      await this.pagoRepository.update(pago.id, {
        estado: 'Fallido',
        raw_response: transaction,
      });
    }
  }
}
```

### Controlador del Webhook:

```typescript
@Controller('webhooks')
export class WebhooksController {
  constructor(private pagosService: PagosService) {}

  @Post('wompi')
  async wompiWebhook(@Body() event: any, @Headers() headers: any) {
    // Verificar la firma del webhook (recomendado)
    const signature = headers['x-wompi-signature'];
    
    // Validar que la petición viene de Wompi
    // ... (implementar validación de firma)

    // Procesar el evento
    await this.pagosService.handleWebhook(event);
    
    return { received: true };
  }
}
```

## 🔐 Variables de Entorno Necesarias

Agrega estas variables a tu archivo `.env`:

```env
# Wompi
WOMPI_PUBLIC_KEY=pub_prod_xxxxxxxxxxxxx
WOMPI_PRIVATE_KEY=prv_prod_xxxxxxxxxxxxx
WOMPI_EVENTS_KEY=prod_events_xxxxxxxxxxxxx
WOMPI_WEBHOOK_URL=https://tu-backend.com/webhooks/wompi

# Frontend
FRONTEND_URL=https://tu-frontend.com
```

## 📱 Flujo de Usuario

1. **Usuario se inscribe en un programa** → Se crea un pago con estado "Pendiente"
2. **Usuario va a "Mis Inscripciones"** → Ve todas sus inscripciones
3. **Usuario hace clic en "Generar Link de Pago"** → Backend crea transacción en Wompi
4. **Usuario es redirigido a Wompi** → Completa el pago
5. **Wompi envía webhook al backend** → Se actualiza el estado del pago
6. **Usuario ve el pago como "Completado"** → En la página de inscripciones

## 🎨 Características de la UI

### Página de Inscripciones (`/mis-inscripciones`)

- ✅ **Diseño profesional** con cards responsivas
- ✅ **Información completa** del programa y pago
- ✅ **Estados visuales** con badges de colores
- ✅ **Formateo de moneda** en pesos colombianos
- ✅ **Formateo de fechas** en español
- ✅ **Modales personalizados** para éxito y error
- ✅ **Loading states** durante la generación del link
- ✅ **Empty state** cuando no hay inscripciones

### Estados de Pago

| Estado | Color | Acción |
|--------|-------|--------|
| Pendiente | Amarillo | Botón "Generar Link de Pago" |
| Completado | Verde | Muestra fecha de pago |
| Fallido | Rojo | Botón "Reintentar Pago" |

## 🔄 Próximos Pasos

1. **Implementar el endpoint** `POST /api/pagos/:pagoId/link-pago` en tu backend
2. **Configurar el webhook** de Wompi en tu backend
3. **Agregar variables de entorno** de Wompi
4. **Crear página de confirmación** de pago (`/pago-confirmacion`)
5. **Probar en ambiente de pruebas** de Wompi
6. **Obtener credenciales de producción** de Wompi

## 📚 Documentación de Wompi

- [Inicio Rápido](https://docs.wompi.co/docs/colombia/inicio-rapido/)
- [Creación de Transacciones](https://docs.wompi.co/docs/colombia/pagos/crear-transaccion/)
- [Webhooks](https://docs.wompi.co/docs/colombia/webhooks/)
- [Ambientes de Prueba](https://docs.wompi.co/docs/colombia/ambiente-de-pruebas/)

## 🧪 Tarjetas de Prueba (Ambiente Sandbox)

```
Aprobada: 4242 4242 4242 4242
Declinada: 4444 4444 4444 4441
CVV: Cualquier 3 dígitos
Fecha: Cualquier fecha futura
```

## 🛡️ Seguridad

- ✅ Todas las peticiones usan tokens JWT
- ✅ Verificación de propiedad del pago
- ✅ Validación de estados
- ✅ Firma de integridad en transacciones
- ✅ Validación de webhooks (recomendado implementar)

## 💡 Notas Adicionales

- El link de pago expira después de cierto tiempo (configurable en Wompi)
- Los pagos se procesan en tiempo real
- Wompi soporta múltiples métodos de pago (tarjetas, PSE, Nequi, etc.)
- Los webhooks son esenciales para actualizar el estado de los pagos

---

¿Necesitas ayuda con la implementación? Contacta al equipo de desarrollo.
