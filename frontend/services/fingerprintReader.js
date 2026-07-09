const LECTORES_CONOCIDOS = [
  { vendorId: 0x05ba, productId: 0x000a, nombre: 'DigitalPersona U.are.U 4500' },
  { vendorId: 0x05ba, productId: 0x000b, nombre: 'DigitalPersona U.are.U 5160' },
  { vendorId: 0x05ba, productId: 0x0101, nombre: 'DigitalPersona U.are.U 5300' },
  { vendorId: 0x1c7a, productId: 0x0001, nombre: 'Futronic FS80' },
  { vendorId: 0x1c7a, productId: 0x0003, nombre: 'Futronic FS88' },
  { vendorId: 0x1162, productId: 0x0301, nombre: 'SecuGen SDU-200' },
  { vendorId: 0x147e, productId: 0x2020, nombre: 'Upek TouchChip' },
];

export class FingerprintReader {
  constructor(options = {}) {
    this.webSocketUrl = options.webSocketUrl || null;
    this.device = null;
    this.ws = null;
    this._onStatusChange = null;
  }

  onStatusChange(callback) {
    this._onStatusChange = callback;
  }

  _notify(status) {
    if (this._onStatusChange) this._onStatusChange(status);
  }

  async conectar() {
    if (!navigator.usb) {
      this._notify({ tipo: 'error', mensaje: 'WebUSB no soportado. Use Chrome/Edge/Opera.' });
      return false;
    }

    try {
      const device = await navigator.usb.requestDevice({
        filters: LECTORES_CONOCIDOS.map(({ vendorId, productId }) => ({ vendorId, productId })),
      });

      this.device = device;
      this._notify({ tipo: 'conectando', mensaje: `Conectando a ${device.productName || 'lector'}...` });

      await device.open();
      await device.selectConfiguration(1);

      const iface = device.configuration.interfaces.find((iface) =>
        iface.alternate.endpoints.some((ep) => ep.direction === 'in')
      );
      if (!iface) throw new Error('No se encontró interfaz de entrada');

      await device.claimInterface(iface.interfaceNumber);
      this._endpointIn = iface.alternate.endpoints.find((ep) => ep.direction === 'in');
      this._endpointOut = iface.alternate.endpoints.find((ep) => ep.direction === 'out');
      this._interfaceNumber = iface.interfaceNumber;

      this._notify({
        tipo: 'conectado',
        mensaje: `Lector conectado: ${device.productName || 'Fingerprint Reader'}`,
        lector: device.productName || 'Desconocido',
      });
      return true;
    } catch (err) {
      if (err.name === 'NotFoundError') {
        this._notify({ tipo: 'error', mensaje: 'No se seleccionó ningún lector' });
      } else {
        this._notify({ tipo: 'error', mensaje: `Error de conexión: ${err.message}` });
      }
      return false;
    }
  }

  async capturar() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this._capturarWebSocket();
    }
    if (this.device) {
      return this._capturarWebUSB();
    }
    throw new Error('No hay lector conectado');
  }

  async _capturarWebUSB() {
    const dataView = new Uint8Array(64);
    dataView[0] = 0x01;
    dataView[1] = 0x00;

    try {
      if (this._endpointOut) {
        await this.device.transferOut(this._endpointOut.endpointNumber, dataView);
      } else {
        await this.device.controlTransferOut({
          requestType: 'class',
          recipient: 'interface',
          request: 0x09,
          value: 0x200,
          index: this._interfaceNumber,
        }, dataView);
      }

      await this._delay(300);

      let result;
      if (this._endpointIn) {
        result = await this.device.transferIn(this._endpointIn.endpointNumber, 64);
      } else {
        result = await this.device.controlTransferIn({
          requestType: 'class',
          recipient: 'interface',
          request: 0x01,
          value: 0x200,
          index: this._interfaceNumber,
        }, 64);
      }

      const data = result.data?.buffer
        ? new Uint8Array(result.data.buffer)
        : new Uint8Array(64);

      return btoa(String.fromCharCode(...data));
    } catch (err) {
      throw new Error(`Error de captura: ${err.message}`);
    }
  }

  async _capturarWebSocket() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Tiempo de espera agotado')), 15000);
      this.ws.onmessage = (event) => {
        clearTimeout(timeout);
        try {
          const msg = JSON.parse(event.data);
          if (msg.tipo === 'captura') {
            resolve(msg.template);
          } else {
            reject(new Error(msg.error || 'Error del servicio biométrico'));
          }
        } catch {
          reject(new Error('Respuesta inválida del servicio biométrico'));
        }
      };
      this.ws.send(JSON.stringify({ accion: 'capturar' }));
    });
  }

  async conectarWebSocket(url) {
    this.webSocketUrl = url;
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
        this.ws.onopen = () => {
          this._notify({ tipo: 'conectado', mensaje: 'Servicio biométrico conectado vía WebSocket', lector: 'WebSocket Bridge' });
          resolve(true);
        };
        this.ws.onerror = () => {
          this._notify({ tipo: 'error', mensaje: 'Error al conectar con el servicio biométrico' });
          reject(new Error('Error WebSocket'));
        };
        this.ws.onclose = () => {
          this._notify({ tipo: 'error', mensaje: 'Servicio biométrico desconectado' });
          this.ws = null;
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  desconectar() {
    if (this.device) {
      try { this.device.close(); } catch {}
      this.device = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    this._notify({ tipo: 'desconectado', mensaje: 'Lector desconectado' });
  }

  _delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export async function detectarLectores() {
  if (!navigator.usb) return [];

  try {
    const devices = await navigator.usb.getDevices();
    return LECTORES_CONOCIDOS.filter((conocido) =>
      devices.some((d) => d.vendorId === conocido.vendorId && d.productId === conocido.productId)
    );
  } catch {
    return [];
  }
}
