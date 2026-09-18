import "server-only";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatCOP } from "@/lib/money";
import { formatFecha, formatFolioContrato } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#18181b" },
  header: { marginBottom: 20 },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#52525b" },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: "1 solid #d4d4d8",
  },
  row: { flexDirection: "row", marginBottom: 4 },
  col: { width: "50%" },
  label: { color: "#71717a" },
  value: { fontFamily: "Helvetica-Bold" },
  table: { marginTop: 4 },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e4e4e7",
    paddingVertical: 5,
  },
  tableRowTotal: {
    flexDirection: "row",
    paddingVertical: 6,
    borderTop: "1 solid #18181b",
    marginTop: 2,
  },
  tableLabel: { width: "70%" },
  tableValue: { width: "30%", textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#a1a1aa",
    textAlign: "center",
  },
});

export type DatosReciboPdf = {
  folio: number;
  numeroPeriodo: number;
  tipoCierre: "NORMAL" | "COMPRA_ANTICIPADA";
  fechaAperturaPeriodo: Date;
  fechaCierre: Date;
  moraAnterior: number;
  arriendoFijoUsado: number;
  metaArriendo: number;
  cobradoPeriodo: number;
  arriendoCubierto: number;
  abonoCapital: number;
  moraNueva: number;
  saldoCapitalAnterior: number;
  saldoCapitalNuevo: number;
  excedenteNoAplicado: number;
  contratoFinalizado: boolean;
  cliente: { nombreCompleto: string; numeroIdentificacion: string };
  motocicleta: { placa: string; marca: string; modelo: string };
};

const TIPO_CIERRE_LABEL: Record<DatosReciboPdf["tipoCierre"], string> = {
  NORMAL: "Cierre normal de periodo",
  COMPRA_ANTICIPADA: "Compra anticipada",
};

function Linea({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableLabel}>{etiqueta}</Text>
      <Text style={styles.tableValue}>{valor}</Text>
    </View>
  );
}

export function ReciboPdfDocument({ datos }: { datos: DatosReciboPdf }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Recibo {formatFolioContrato(datos.folio)} · Periodo {datos.numeroPeriodo}
          </Text>
          <Text style={styles.subtitle}>{TIPO_CIERRE_LABEL[datos.tipoCierre]}</Text>
          <Text style={styles.subtitle}>
            Documento interno de control — sin validez fiscal
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del contrato</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Cliente</Text>
              <Text style={styles.value}>
                {datos.cliente.nombreCompleto} — {datos.cliente.numeroIdentificacion}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Motocicleta</Text>
              <Text style={styles.value}>
                {datos.motocicleta.placa} — {datos.motocicleta.marca} {datos.motocicleta.modelo}
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Periodo</Text>
              <Text style={styles.value}>
                {formatFecha(datos.fechaAperturaPeriodo)} — {formatFecha(datos.fechaCierre)}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Fecha de cierre</Text>
              <Text style={styles.value}>{formatFecha(datos.fechaCierre)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cálculo del periodo</Text>
          <View style={styles.table}>
            <Linea etiqueta="Mora del periodo anterior" valor={formatCOP(datos.moraAnterior)} />
            <Linea etiqueta="Arriendo fijo mensual" valor={formatCOP(datos.arriendoFijoUsado)} />
            <Linea etiqueta="Meta del periodo (arriendo + mora anterior)" valor={formatCOP(datos.metaArriendo)} />
            <Linea etiqueta="Total cobrado en el periodo" valor={formatCOP(datos.cobradoPeriodo)} />
            <Linea etiqueta="Arriendo cubierto" valor={formatCOP(datos.arriendoCubierto)} />
            <Linea etiqueta="Abono a capital" valor={formatCOP(datos.abonoCapital)} />
            {datos.tipoCierre === "COMPRA_ANTICIPADA" && (
              <Linea etiqueta="Excedente no aplicado" valor={formatCOP(datos.excedenteNoAplicado)} />
            )}
            <Linea etiqueta="Mora que queda pendiente" valor={formatCOP(datos.moraNueva)} />
            <View style={styles.tableRowTotal}>
              <Text style={[styles.tableLabel, styles.value]}>Saldo de capital pendiente</Text>
              <Text style={[styles.tableValue, styles.value]}>{formatCOP(datos.saldoCapitalNuevo)}</Text>
            </View>
          </View>
        </View>

        {datos.contratoFinalizado && (
          <View style={styles.section}>
            <Text style={styles.value}>
              Este cierre finalizó el contrato — saldo de capital saldado en su totalidad.
            </Text>
          </View>
        )}

        <Text style={styles.footer}>
          Generado el {formatFecha(new Date())} · Recibo regenerable a partir del registro guardado del cierre.
        </Text>
      </Page>
    </Document>
  );
}

export async function generarReciboPdf(datos: DatosReciboPdf): Promise<Buffer> {
  return renderToBuffer(<ReciboPdfDocument datos={datos} />);
}
