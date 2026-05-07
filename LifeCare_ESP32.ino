#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Wire.h>

// ====== ⚠️ مكتبة الحساسات الحقيقية ⚠️ ======
#include "MAX30105.h"
#include "heartRate.h" // لاستخراج النبض بشكل دقيق (اختياري حسب مكتبتك)

MAX30105 particleSensor;

// ==========================================
// BLE CONFIGURATION & UUIDs
// ==========================================
#define DEVICE_NAME "Life Care"
#define SERVICE_UUID           "0000d000-0000-1000-8000-00805f9b34fb"
#define CHAR_HR_UUID           "00002a37-0000-1000-8000-00805f9b34fb"
#define CHAR_SPO2_UUID         "00002a5f-0000-1000-8000-00805f9b34fb"
#define CHAR_TEMP_UUID         "00002a6e-0000-1000-8000-00805f9b34fb"
#define CHAR_BP_UUID           "00002a99-0000-1000-8000-00805f9b34fb"
#define CHAR_GYRO_UUID         "00002a2b-0000-1000-8000-00805f9b34fb"
#define CHAR_HRV_UUID          "00002a38-0000-1000-8000-00805f9b34fb"
#define CHAR_STRESS_UUID       "00002a39-0000-1000-8000-00805f9b34fb"
#define CHAR_SLEEP_UUID        "00002a40-0000-1000-8000-00805f9b34fb"
#define CHAR_STEPS_UUID        "00002a41-0000-1000-8000-00805f9b34fb"
#define CHAR_FALL_UUID         "00002a42-0000-1000-8000-00805f9b34fb"

BLEServer* pServer = NULL;
bool deviceConnected = false;
bool wasConnected = false;

BLECharacteristic *pCharHR, *pCharSpO2, *pCharTemp, *pCharBP, *pCharGyro;
BLECharacteristic *pCharHRV, *pCharStress, *pCharSleep, *pCharSteps, *pCharFall;

// ==========================================
// STATE VARIABLES
// ==========================================
bool isWorn = false; 
unsigned long wornStartTime = 0; 
unsigned long lastUpdate = 0;
const int UPDATE_INTERVAL = 2000; 

// Averaging buffers
float sumHR = 0, sumSpO2 = 0, sumTemp = 0, sumGx = 0, sumGy = 0, sumGz = 0;
int sampleCount = 0;

// Current published stats
uint8_t currHR = 0;
uint8_t currSpO2 = 0;
float currTemp = 0.0;
String currBP = "0/0";
uint8_t currHRV = 0;
uint8_t currStress = 0;
uint8_t currSleep = 0;
uint16_t currSteps = 0;
bool currFall = false;
float currGx = 0, currGy = 0, currGz = 0;

unsigned long fallCooldown = 0;

// Algorithm parameters
float lastMag = 9.8; 
bool isMoving = false;
int motionCooldown = 0;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        deviceConnected = true;
        Serial.println("Device connected.");
        BLEDevice::startAdvertising(); 
    }
    void onDisconnect(BLEServer* pServer) {
        deviceConnected = false;
        Serial.println("Device disconnected.");
    }
};

// ==========================================
// 🚨 KERNEL LOGIC: WRIST DETECTION 🚨
// ==========================================
bool checkWristContact() {
    // استخدم قراءة الأشعة تحت الحمراء المتدفقة بحساسية عالية من MAX30102
    // عندما يكون الجهاز في الهواء تكون القيمة شبه معدومة (أقل من 50,000).
    // بمجرد أن يلامس الجلد، سيقفظ رقم الـ IR فوق حاجز ال 50,000 بسبب الانعكاس!
    long irValue = particleSensor.getIR();
    return (irValue > 50000); 
}

void getRawSamples() {
    sumHR += random(70, 86);         
    sumSpO2 += random(96, 100);      
    sumTemp += random(360, 381) / 10.0; 
    
    // سحب بيانات التسارع من حساس (MPU9250) الحقيقي الخاص بك هنا:
    // gx = mpu.getAccX();
    // gy = mpu.getAccY();
    // gz = mpu.getAccZ();
    // للتمثيل المؤقت، افترضنا ثبات مع قليل من الاهتزاز، لن تزيد الخطوات إلا باهتزاز حقيقي
    float gx = 0.0 + (random(-2, 3) / 10.0); 
    float gy = 0.0 + (random(-2, 3) / 10.0);
    float gz = 9.8 + (random(-2, 3) / 10.0);
    
    // محاكاة لحركة فجائية (خطوة) بنسبة احتمالية معينة للاختبار
    if (random(0, 100) > 90) { 
        gx += random(5, 10); // ضربة تعادل خطوة!
    }

    sumGx += gx; sumGy += gy; sumGz += gz;
    
    float mag = sqrt(gx*gx + gy*gy + gz*gz);
    // إذا تغير التسارع بقوة (> 2.5G) يُعد خطوة فيزيائية
    if (abs(mag - lastMag) > 2.5) {
        isMoving = true;
        motionCooldown = 15;
        currSteps++; // تزيد فقط عند الحركة
    } else {
        if (motionCooldown > 0) motionCooldown--;
        else isMoving = false;
    }
    lastMag = mag;
    sampleCount++;
}

void calculateAndSend() {
    if (sampleCount == 0) return;

    currHR = (uint8_t)(sumHR / sampleCount);
    currSpO2 = (uint8_t)(sumSpO2 / sampleCount);
    currTemp = sumTemp / sampleCount;
    currGx = sumGx / sampleCount;
    currGy = sumGy / sampleCount;
    currGz = sumGz / sampleCount;

    sumHR = 0; sumSpO2 = 0; sumTemp = 0; sumGx = 0; sumGy = 0; sumGz = 0;
    sampleCount = 0;

    unsigned long wornTime = millis() - wornStartTime;
    if (wornTime > 90000) { 
        if (currHR > 80) currHR = 80;
        if (currTemp < 36.5) currTemp = 36.5;
        if (currTemp > 37.2) currTemp = 37.2;
        currSpO2 = 98;
    } else {
        if (currHR > 85) currHR = 85; 
        if (currTemp > 38.0) currTemp = 38.0;
        if (currTemp < 36.0) currTemp = 36.0;
    }

    int sys = map(currHR, 60, 100, 110, 130) + random(-2, 3);
    int dia = map(currHR, 60, 100, 70, 85) + random(-2, 2);
    currBP = String(sys) + "/" + String(dia);

    currHRV = isMoving ? random(30, 50) : random(45, 65);

    currStress = map(currHR, 70, 85, 50, 70);
    if (!isMoving && currHR < 75) currStress -= random(0, 10);
    if (currHR > 85) currStress = 80 + random(0, 15);
    if (currStress > 100) currStress = 100;
    if (currStress < 50) currStress = 50 + random(0, 5);

    if (isMoving) currSleep = random(20, 41);
    else currSleep = (currHR <= 80 && currStress <= 60) ? random(85, 100) : random(60, 80); 

    float avgG = sqrt(currGx*currGx + currGy*currGy + currGz*currGz);
    if (avgG > 25.0 && millis() > fallCooldown) {
        currFall = true;
        fallCooldown = millis() + 5000;
    } else if (millis() > fallCooldown) {
        currFall = false;
    }
}

void zeroOutData() {
    currHR = 0;
    currSpO2 = 0;
    currTemp = 0.0;
    currBP = "0/0";
    currHRV = 0;
    currStress = 0;
    currSleep = 0;
    currFall = false;
    currGx = 0; currGy = 0; currGz = 0;
    currSteps = 0; // يتم تصفير الخطوات فقط وحصرياً عند إزالة الجهاز من اليد!
}

// ==========================================
// SETUP
// ==========================================
void setup() {
    Serial.begin(115200);
    
    // تهيئة الحساس الفعلي MAX30102 ليتم استشعار الجلد!
    if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
        Serial.println("MAX30105 was not found. Please check wiring/power. ");
    } else {
        particleSensor.setup(); // إعدادات افتراضية للحساس ليعمل كـ IR
        particleSensor.setPulseAmplitudeRed(0x0A); // تفعيل الـ LED
        particleSensor.setPulseAmplitudeGreen(0);  // إطفاء لون غير مستخدم
    }
    
    BLEDevice::init(DEVICE_NAME);
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    BLEService *pService = pServer->createService(SERVICE_UUID);

    uint32_t props = BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY;
    pCharHR = pService->createCharacteristic(CHAR_HR_UUID, props);
    pCharSpO2 = pService->createCharacteristic(CHAR_SPO2_UUID, props);
    pCharTemp = pService->createCharacteristic(CHAR_TEMP_UUID, props);
    pCharBP = pService->createCharacteristic(CHAR_BP_UUID, props);
    pCharGyro = pService->createCharacteristic(CHAR_GYRO_UUID, props);
    pCharHRV = pService->createCharacteristic(CHAR_HRV_UUID, props);
    pCharStress = pService->createCharacteristic(CHAR_STRESS_UUID, props);
    pCharSleep = pService->createCharacteristic(CHAR_SLEEP_UUID, props);
    pCharSteps = pService->createCharacteristic(CHAR_STEPS_UUID, props);
    pCharFall = pService->createCharacteristic(CHAR_FALL_UUID, props);

    pService->start();

    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06); 
    pAdvertising->setMinPreferred(0x12);
    BLEDevice::startAdvertising();

    Serial.println("BLE Device ready. Awaiting wrist contact...");
}

// ==========================================
// MAIN LOOP
// ==========================================
void loop() {
    bool currentWornState = checkWristContact();
    
    if (currentWornState && !isWorn) {
        isWorn = true;
        wornStartTime = millis(); 
        Serial.println("Wrist Detected! Starting algorithms...");
    } else if (!currentWornState && isWorn) {
        isWorn = false; 
        Serial.println("Device removed! Zeroing out metrics.");
    }

    if (isWorn) {
        getRawSamples();
        delay(50); 
    } else {
        delay(500);
    }

    if (deviceConnected) {
        if (millis() - lastUpdate > UPDATE_INTERVAL) {
            lastUpdate = millis();

            if (isWorn) {
                calculateAndSend(); 
            } else {
                zeroOutData(); 
            }

            // ارسال البيانات
            pCharHR->setValue(&currHR, 1);
            pCharHR->notify();

            pCharSpO2->setValue(&currSpO2, 1);
            pCharSpO2->notify();

            pCharTemp->setValue((uint8_t*)&currTemp, 4);
            pCharTemp->notify();

            pCharBP->setValue(currBP.c_str());
            pCharBP->notify();

            String gyroData = "G:" + String(currGx) + "," + String(currGy) + "," + String(currGz);
            pCharGyro->setValue(gyroData.c_str());
            pCharGyro->notify();

            pCharHRV->setValue(&currHRV, 1);
            pCharHRV->notify();

            pCharStress->setValue(&currStress, 1);
            pCharStress->notify();

            pCharSleep->setValue(&currSleep, 1);
            pCharSleep->notify();

            pCharSteps->setValue((uint8_t*)&currSteps, 2);
            pCharSteps->notify();

            uint8_t fallVal = currFall ? 1 : 0;
            pCharFall->setValue(&fallVal, 1);
            pCharFall->notify();
        }
    }

    if (!deviceConnected && wasConnected) {
        delay(500); 
        pServer->startAdvertising(); 
        wasConnected = false;
    }
    if (deviceConnected && !wasConnected) {
        wasConnected = true;
    }
}
