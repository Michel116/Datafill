
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { QrCode, ListChecks, Hash, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

type Stage = 'SCAN_QR' | 'SELECT_ROW' | 'ENTER_MEASUREMENT' | 'COMPLETED_SET';

interface RowOption {
  value: string;
  label: string;
  correction: number;
  lowerLimit: number;
  upperLimit: number;
}

// This interface should ideally be in a shared types file if used in multiple places
interface MeasurementRecord {
  id: string;
  timestamp: string;
  serialNumber: string;
  deviceName: string;
  deviceType: string;
  selectedPointLabel: string;
  selectedPointValue: string;
  correction: number;
  measurements: number[];
  averageMeasurement: number;
  correctedAverageMeasurement: number;
  lowerLimit: number;
  upperLimit: number;
  result: 'ГОДЕН' | 'БРАК';
}


const ROW_OPTIONS: RowOption[] = [
  { value: "32.3", label: "32.3 °C", correction: -4.0, lowerLimit: 32.0, upperLimit: 32.6 },
  { value: "34.8", label: "34.8 °C", correction: -2.2, lowerLimit: 34.5, upperLimit: 35.1 },
  { value: "37.0", label: "37.0 °C", correction: -3.7, lowerLimit: 36.7, upperLimit: 37.3 },
];

const MEASUREMENTS_COUNT = 3;

function FillDataContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [deviceType, setDeviceType] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  
  const [stage, setStage] = useState<Stage>('SCAN_QR');
  const [serialNumber, setSerialNumber] = useState('');
  const [selectedRow, setSelectedRow] = useState<RowOption | null>(null);
  const [currentMeasurementIndex, setCurrentMeasurementIndex] = useState(0);
  const [measurements, setMeasurements] = useState<number[]>([]);
  const [currentNumberInput, setCurrentNumberInput] = useState('');
  const [resultStatus, setResultStatus] = useState<'ГОДЕН' | 'БРАК' | null>(null);

  useEffect(() => {
    const device = searchParams.get('device');
    const name = searchParams.get('deviceName');
    if (!device || !name) {
      toast({
        title: "Ошибка",
        description: "Тип устройства не указан. Пожалуйста, выберите устройство.",
        variant: "destructive",
      });
      router.push('/');
      return;
    }
    setDeviceType(device);
    setDeviceName(name);
    // Reset state
    setStage('SCAN_QR');
    setSerialNumber('');
    setSelectedRow(null);
    setCurrentMeasurementIndex(0);
    setMeasurements([]);
    setCurrentNumberInput('');
    setResultStatus(null);
  }, [searchParams, router, toast]);

  const handleQrScanSubmit = () => {
    if (!serialNumber.trim()) {
      toast({ title: "Ошибка", description: "Серийный номер не может быть пустым.", variant: "destructive" });
      return;
    }
    setStage('SELECT_ROW');
    toast({ title: "Серийный номер принят", description: `S/N: ${serialNumber}`,variant: "default" });
  };

  const handleRowSelect = (row: RowOption) => {
    setSelectedRow(row);
    setCurrentMeasurementIndex(0);
    setMeasurements([]);
    setCurrentNumberInput('');
    setResultStatus(null);
    setStage('ENTER_MEASUREMENT');
    toast({ title: "Точка поверки выбрана", description: `Точка: ${row.label}`, variant: "default" });
  };

  const handleMeasurementInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const previousValue = currentNumberInput;
    let inputValue = e.target.value;

    // Allow only digits and at most one decimal point.
    let sanitizedValue = "";
    let hasDecimal = false;
    for (const char of inputValue) {
      if (char >= '0' && char <= '9') {
        sanitizedValue += char;
      } else if (char === '.' && !hasDecimal) {
        sanitizedValue += char;
        hasDecimal = true;
      }
    }
    inputValue = sanitizedValue;
  
    const isTyping = inputValue.length > previousValue.length;
    const parts = inputValue.split('.');
  
    if (isTyping && parts.length === 1) { // Only apply if no decimal point exists yet AND user is typing
      if (parts[0].length === 2) {
        // Input was '1', user types '2' -> '12', becomes '12.'
        inputValue = parts[0] + '.';
      } else if (parts[0].length > 2) {
        // User pastes '123' or types '12' then '3' quickly
        inputValue = parts[0].substring(0, 2) + '.' + parts[0].substring(2);
      }
    }
    
    // Optional: Limit decimal places after the dot, e.g., to one decimal place
    // const finalParts = inputValue.split('.');
    // if (finalParts.length > 1 && finalParts[1].length > 1) {
    //    inputValue = finalParts[0] + '.' + finalParts[1].substring(0,1);
    // }
  
    setCurrentNumberInput(inputValue);
  };

  const handleMeasurementSubmit = () => {
    const num = parseFloat(currentNumberInput);
    if (isNaN(num)) {
      toast({ title: "Ошибка", description: "Пожалуйста, введите действительное число.", variant: "destructive" });
      return;
    }
    const newMeasurements = [...measurements, num];
    setMeasurements(newMeasurements);
    setCurrentNumberInput('');

    if (newMeasurements.length < MEASUREMENTS_COUNT) {
      setCurrentMeasurementIndex(newMeasurements.length);
      toast({ title: "Измерение добавлено", description: `Измерение ${newMeasurements.length}/${MEASUREMENTS_COUNT} принято.`, variant: "default" });
    } else {
      if (selectedRow && deviceName && deviceType) { 
        const averageMeasurement = newMeasurements.reduce((a, b) => a + b, 0) / newMeasurements.length;
        const correctedAverage = averageMeasurement + selectedRow.correction;
        const currentResStatus = (correctedAverage >= selectedRow.lowerLimit && correctedAverage <= selectedRow.upperLimit) ? "ГОДЕН" : "БРАК";
        setResultStatus(currentResStatus);

        const recordToSave: MeasurementRecord = {
          id: `${Date.now()}-${serialNumber}-${selectedRow.value}`,
          timestamp: new Date().toISOString(),
          serialNumber,
          deviceName,
          deviceType,
          selectedPointLabel: selectedRow.label,
          selectedPointValue: selectedRow.value,
          correction: selectedRow.correction,
          measurements: newMeasurements,
          averageMeasurement: parseFloat(averageMeasurement.toFixed(2)),
          correctedAverageMeasurement: parseFloat(correctedAverage.toFixed(2)),
          lowerLimit: selectedRow.lowerLimit,
          upperLimit: selectedRow.upperLimit,
          result: currentResStatus,
        };
        
        if (typeof window !== 'undefined') {
          try {
            const existingRecordsRaw = localStorage.getItem('measurementRecords');
            const existingRecords: MeasurementRecord[] = existingRecordsRaw ? JSON.parse(existingRecordsRaw) : [];
            existingRecords.push(recordToSave);
            localStorage.setItem('measurementRecords', JSON.stringify(existingRecords));
            toast({
              title: `Запись сохранена локально`,
              description: `Данные для S/N ${serialNumber} по точке ${selectedRow.label} сохранены.`,
              variant: "default",
              duration: 3000,
            });
          } catch (error) {
            toast({
              title: "Ошибка сохранения",
              description: "Не удалось сохранить запись локально.",
              variant: "destructive",
            });
          }
        }

        toast({
          title: `Результат: ${currentResStatus}`,
          description: `S/N ${serialNumber}, ${selectedRow.label}. Ср.изм: ${averageMeasurement.toFixed(2)}, Скорр.ср: ${correctedAverage.toFixed(2)}°C. Пределы: ${selectedRow.lowerLimit}-${selectedRow.upperLimit}°C.`,
          variant: currentResStatus === "ГОДЕН" ? "default" : "destructive",
          className: currentResStatus === "ГОДЕН" ? "bg-accent text-accent-foreground border-accent" : "",
          duration: 5000,
        });
      }
      
      setStage('COMPLETED_SET'); 
      setTimeout(() => {
        setSerialNumber('');
        setSelectedRow(null); 
        setCurrentMeasurementIndex(0);
        setMeasurements([]);
        setCurrentNumberInput('');
        setResultStatus(null);
        setStage('SCAN_QR');
      }, 3000); 
    }
  };
  
  const goBack = () => {
    if (stage === 'ENTER_MEASUREMENT') {
      setStage('SELECT_ROW');
      setResultStatus(null); 
    } else if (stage === 'SELECT_ROW') {
      setStage('SCAN_QR');
    } else if (stage === 'SCAN_QR' || stage === 'COMPLETED_SET') {
      router.push('/');
    }
  };
  
  const progressValue = stage === 'ENTER_MEASUREMENT' ? ((currentMeasurementIndex +1) / MEASUREMENTS_COUNT) * 100 : 0;

  if (!deviceType || !deviceName) {
    return (
      <PageLayout pageTitle="Загрузка...">
        <div className="text-center py-10">
          <p className="text-muted-foreground">Загрузка данных об устройстве...</p>
        </div>
      </PageLayout>
    );
  }
  
  const pageFlowTitle = deviceName ? `${deviceName} :: S/N: ${serialNumber || 'Новый'} ${selectedRow ? `:: Точка: ${selectedRow.label}` : ''}` : 'Заполнение данных';

  return (
    <PageLayout pageTitle={pageFlowTitle}>
      <Card className="w-full">
        <CardHeader>
          {stage === 'SCAN_QR' && <CardTitle className="flex items-center gap-2"><QrCode className="h-6 w-6 text-primary" />Сканирование QR / Ввод S/N</CardTitle>}
          {stage === 'SELECT_ROW' && <CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary" />Выбор точки поверки</CardTitle>}
          {stage === 'ENTER_MEASUREMENT' && <CardTitle className="flex items-center gap-2"><Hash className="h-6 w-6 text-primary" />Ввод измерений для {selectedRow?.label} ({currentMeasurementIndex + 1}/{MEASUREMENTS_COUNT})</CardTitle>}
          {stage === 'COMPLETED_SET' && <CardTitle className="flex items-center gap-2">
            {resultStatus === "ГОДЕН" ? <CheckCircle2 className="h-6 w-6 text-accent" /> : <AlertTriangle className="h-6 w-6 text-destructive" /> }
            Комплект данных обработан
            </CardTitle>}
          <CardDescription>
            {stage === 'SCAN_QR' && `Введите серийный номер для устройства "${deviceName}".`}
            {stage === 'SELECT_ROW' && `Для S/N: ${serialNumber}. Выберите точку поверки для заполнения.`}
            {stage === 'ENTER_MEASUREMENT' && `Для S/N: ${serialNumber}, Точка: ${selectedRow?.label}. Введите измерение.`}
            {stage === 'COMPLETED_SET' && `Данные для S/N ${serialNumber} по точке ${selectedRow?.label} обработаны. Результат: ${resultStatus}. Подготовьте следующее устройство или точку.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {stage === 'SCAN_QR' && (
            <div className="space-y-4">
              <Label htmlFor="serialNumber">Серийный номер</Label>
              <Input
                id="serialNumber"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Напр. ABC123XYZ789"
                aria-label="Серийный номер"
              />
              <Button onClick={handleQrScanSubmit} className="w-full" disabled={!serialNumber.trim()}>
                <ArrowRight className="mr-2 h-4 w-4" /> Далее
              </Button>
            </div>
          )}

          {stage === 'SELECT_ROW' && (
            <div className="space-y-4">
              <p className="font-medium text-foreground">Доступные точки поверки:</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {ROW_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    onClick={() => handleRowSelect(option)}
                    className="w-full text-lg py-6"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {stage === 'ENTER_MEASUREMENT' && selectedRow && (
            <div className="space-y-4">
              <Label htmlFor="measurementValue">Значение измерения ({currentMeasurementIndex + 1}/{MEASUREMENTS_COUNT})</Label>
              <Progress value={progressValue} className="w-full h-2" />
              <p className="text-sm text-muted-foreground">
                Поправка: {selectedRow.correction}°C, Пределы: {selectedRow.lowerLimit}°C ... {selectedRow.upperLimit}°C
              </p>
              <Input
                id="measurementValue"
                type="text"
                inputMode="decimal"
                value={currentNumberInput}
                onChange={handleMeasurementInputChange}
                placeholder="Напр. 36.6"
                aria-label="Значение измерения"
                onKeyDown={(e) => e.key === 'Enter' && handleMeasurementSubmit()}
              />
              <Button onClick={handleMeasurementSubmit} className="w-full" disabled={!currentNumberInput.trim()}>
                <ArrowRight className="mr-2 h-4 w-4" /> Добавить измерение ({measurements.length + 1}/{MEASUREMENTS_COUNT})
              </Button>
            </div>
          )}
          
          {stage === 'COMPLETED_SET' && (
             <div className="text-center py-4">
                {resultStatus === "ГОДЕН" ? 
                  <CheckCircle2 className="h-16 w-16 text-accent mx-auto mb-4" /> :
                  <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
                }
                <p className="text-lg font-semibold">
                  {resultStatus === "ГОДЕН" ? "Отлично! Данные сохранены." : "Внимание! Обнаружен брак."}
                </p>
                <p className="text-muted-foreground">
                  Результат: {resultStatus}. Можно сканировать следующий QR-код или выбрать другую точку.
                </p>
            </div>
          )}

          <Button variant="outline" onClick={goBack} className="w-full mt-4" disabled={stage === 'COMPLETED_SET'}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            {stage === 'SCAN_QR' ? 'К выбору устройства' : 'Назад'}
          </Button>
        </CardContent>
      </Card>
    </PageLayout>
  );
}


export default function FillDataPage() {
  return (
    <Suspense fallback={<PageLayout pageTitle="Загрузка..."><div className="text-center py-10"><p className="text-muted-foreground">Загрузка...</p></div></PageLayout>}>
      <FillDataContent />
    </Suspense>
  );
}
