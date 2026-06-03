/**
 * Intelligence Engine - Rule-based Algorithmic Analyzer
 * Generates advanced health insights without external APIs.
 */

class IntelligenceEngine {
  
  /**
   * Main entry point to generate comprehensive insights.
   * @param {Array} vitals - 30 days of VitalsHistory
   * @param {Array} alerts - 30 days of AlertEvent
   * @param {Array} notes - 30 days of PatientNote
   * @param {String} role - user role (patient, companion, doctor)
   */
  static generateComprehensiveReport(vitals, alerts, notes, role) {
    let insights = [];

    // 0. Device Status & Data Quality
    const deviceInsights = this.analyzeDeviceStatus(vitals);
    insights = insights.concat(deviceInsights);
    
    const dataReliability = this.calculateDataReliability(vitals);
    insights.unshift(dataReliability);

    // 1. Pattern Detection
    const patterns = this.detectPatterns(vitals, alerts);
    insights = insights.concat(patterns);

    // 2. Temporal Analysis
    const temporal = this.analyzeTemporal(alerts);
    insights = insights.concat(temporal);

    // 3. Risk Evaluation & Overall Health Risk Score
    const risk = this.evaluateRisk(alerts);
    insights = insights.concat(risk);
    
    const riskScoreInsight = this.calculateHealthRiskScore(vitals, alerts);
    insights.unshift(riskScoreInsight); // Put the overall score at the top

    // 4. Event Interpretation (Note Correlations)
    const interpretations = this.interpretEvents(alerts, notes);
    insights = insights.concat(interpretations);

    // 5. Role-based filtering and suggestions
    return this.applyRoleFilters(insights, role);
  }

  static analyzeDeviceStatus(vitals) {
    const insights = [];
    if (vitals.length === 0) return insights;

    // Check for multiple disconnections
    const disconnections = vitals.filter(v => v.deviceStatus === 'disconnected' || v.deviceStatus === 'error');
    if (disconnections.length > 5) {
      insights.push({
        type: 'Device',
        title: 'مشاكل في اتصال المستشعرات',
        description: `تم رصد ${disconnections.length} حالات انقطاع أو خطأ في قراءة الأجهزة الطبية خلال الـ 30 يوماً الماضية. بعض الانخفاضات في القراءات قد تكون وهمية نتيجة لضعف الاتصال.`
      });
    }

    // Check battery level
    const latestVitals = vitals[vitals.length - 1];
    if (latestVitals && latestVitals.batteryLevel && latestVitals.batteryLevel < 20) {
      insights.push({
        type: 'Device',
        title: 'تنبيه: بطارية الجهاز منخفضة',
        description: `مستوى بطارية جهاز القياس الحالي (${latestVitals.batteryLevel}%). يُرجى شحن الجهاز لضمان عدم انقطاع التيار الزمني للقراءات.`
      });
    }

    return insights;
  }

  static calculateDataReliability(vitals) {
    let score = 100;
    
    if (vitals.length === 0) {
      return { type: 'DataQuality', title: 'جودة البيانات', description: 'Data Reliability: 0%' };
    }

    // Connectivity issues penalty (Max -30)
    const disconnections = vitals.filter(v => v.deviceStatus === 'disconnected' || v.deviceStatus === 'error').length;
    score -= Math.min(30, disconnections * 2);

    // Missing data rate penalty (Max -20)
    if (vitals.length < 50) score -= 20;
    else if (vitals.length < 150) score -= 10;

    // Noise in readings (Sensor stability) (Max -20)
    const hrData = vitals.map(v => v.heartRate).filter(v => v != null && v > 0);
    const hrStats = this.calculateBaselineStats(hrData);
    if (hrStats.sd > 25) score -= 20;
    else if (hrStats.sd > 15) score -= 10;

    score = Math.max(0, score); // Ensure minimum is 0

    return {
      type: 'DataQuality',
      title: 'موثوقية البيانات',
      description: `Data Reliability: ${score}%`
    };
  }

  static calculateBaselineStats(dataArray) {
    if (dataArray.length === 0) return { avg: 0, sd: 0 };
    const mean = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const variance = dataArray.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dataArray.length;
    return { avg: mean, sd: Math.sqrt(variance) };
  }

  // Calculate simple linear regression slope to detect gradual increase/decrease
  static calculateTrend(dataArray) {
    if (dataArray.length < 2) return 0;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = dataArray.length;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += dataArray[i];
      sumXY += i * dataArray[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope; // Positive means increasing, negative means decreasing
  }

  static detectPatterns(vitals, alerts) {
    const insights = [];
    
    // Calculate Dynamic Baseline from 30-day vitals
    const hrData = vitals.map(v => v.heartRate).filter(v => v != null && v > 0);
    const hrStats = this.calculateBaselineStats(hrData);
    
    let anomalousPatternFound = false;

    // Detect Sudden spikes or drops (Deviation > 3 Standard Deviations)
    // Detect Unusual fluctuations (Variance outside normal pattern)
    if (hrStats.sd > 0) {
      const upperLimit = hrStats.avg + (3 * hrStats.sd);
      const lowerLimit = hrStats.avg - (3 * hrStats.sd);
      
      const extremeSpikes = hrData.filter(hr => hr > upperLimit);
      const extremeDrops = hrData.filter(hr => hr < lowerLimit);

      // Check for unusual fluctuations (e.g. standard deviation in the last 24 hours is much higher than 30 days)
      const last24hVitals = vitals.filter(v => (new Date().getTime() - new Date(v.timestamp).getTime()) < 24 * 60 * 60 * 1000);
      const last24hHR = last24hVitals.map(v => v.heartRate).filter(v => v != null && v > 0);
      const recentHrStats = this.calculateBaselineStats(last24hHR);

      if (extremeSpikes.length > 0 || extremeDrops.length > 0 || (recentHrStats.sd > hrStats.sd * 2 && recentHrStats.sd > 5)) {
        anomalousPatternFound = true;
      }
    }

    if (anomalousPatternFound) {
      insights.push({
        type: 'Pattern',
        title: 'شذوذ في النمط الحيوي',
        description: "Anomalous pattern detected compared to patient's baseline."
      });
    }

    // Time-based Trends & Multi-signal deterioration (Early Warning)
    // We look at the most recent 48 hours for gradual deterioration
    const recent48hVitals = vitals.filter(v => (new Date().getTime() - new Date(v.timestamp).getTime()) < 48 * 60 * 60 * 1000);
    
    if (recent48hVitals.length > 5) {
      const recentHR = recent48hVitals.map(v => v.heartRate).filter(v => v != null && v > 0);
      const recentSpO2 = recent48hVitals.map(v => v.spO2).filter(v => v != null && v > 0);
      const recentTemp = recent48hVitals.map(v => v.temperature).filter(v => v != null && v > 0);

      const hrSlope = this.calculateTrend(recentHR);
      const spo2Slope = this.calculateTrend(recentSpO2);
      const tempSlope = this.calculateTrend(recentTemp);

      // Multi-signal deterioration: HR going up, SpO2 going down, Temp going up gradually
      const isHrIncreasing = hrSlope > 0.1; // threshold for slope significance
      const isSpo2Decreasing = spo2Slope < -0.05;
      const isTempIncreasing = tempSlope > 0.01;

      // If at least two negative trends combine
      if ((isHrIncreasing && isSpo2Decreasing) || (isHrIncreasing && isTempIncreasing) || (isSpo2Decreasing && isTempIncreasing)) {
        insights.push({
          type: 'EarlyWarning',
          title: 'تحذير استباقي: تدهور تدريجي',
          description: "Potential health instability detected in near future."
        });
      }
    }

    // Check for repetitive HR spikes (Rule-based backup)
    const hrSpikes = alerts.filter(a => a.sensorType === 'Heart Rate' && a.severity === 'Critical');
    if (hrSpikes.length >= 3) {
      insights.push({
        type: 'Pattern',
        title: 'نمط متكرر: تسارع نبض القلب',
        description: `تم رصد ${hrSpikes.length} حالات لارتفاع حرج في نبض القلب خلال الـ 30 يوماً الماضية. هذا النمط المتكرر يتطلب المراقبة المستمرة.`
      });
    }

    // Check for SpO2 drops
    const spo2Drops = alerts.filter(a => a.sensorType === 'SpO2' && a.readingValue < 92);
    if (spo2Drops.length >= 2) {
      insights.push({
        type: 'Pattern',
        title: 'نمط متكرر: انخفاض الأكسجين',
        description: `تم تسجيل ${spo2Drops.length} حالات انخفاض في نسبة الأكسجين بالدم. إذا تكرر ذلك مع مجهود بدني، يُنصح باستشارة الطبيب.`
      });
    }

    return insights;
  }

  static analyzeTemporal(alerts) {
    const insights = [];
    if (alerts.length === 0) return insights;

    let morning = 0, afternoon = 0, evening = 0, night = 0;

    alerts.forEach(a => {
      const hour = a.startTime.getHours();
      if (hour >= 6 && hour < 12) morning++;
      else if (hour >= 12 && hour < 18) afternoon++;
      else if (hour >= 18 && hour < 24) evening++;
      else night++;
    });

    const maxPeriod = Math.max(morning, afternoon, evening, night);
    const total = alerts.length;

    // If more than 50% of alerts happen in one specific period
    if (maxPeriod / total >= 0.5 && total >= 3) {
      let periodName = '';
      if (maxPeriod === morning) periodName = 'الصباح';
      else if (maxPeriod === afternoon) periodName = 'فترة الظهيرة';
      else if (maxPeriod === evening) periodName = 'المساء';
      else periodName = 'الليل';

      insights.push({
        type: 'Temporal',
        title: 'تركز زمني للأعراض',
        description: `لوحظ أن حوالي ${Math.round((maxPeriod/total)*100)}% من التنبيهات الصحية تتركز في فترة ${periodName}. قد يكون هذا مرتبطاً بمواعيد الأدوية أو نمط النوم.`
      });
    }

    if (night >= 2) {
      insights.push({
        type: 'Temporal',
        title: 'اضطرابات ليلية',
        description: `تم رصد ${night} أحداث غير طبيعية أثناء الليل. هذا قد يشير إلى اضطرابات في جودة النوم.`
      });
    }

    return insights;
  }

  static evaluateRisk(alerts) {
    const insights = [];
    let criticalCount = 0;
    let longDurationCount = 0;

    // Compounding Risk
    const alertsByDay = {};
    alerts.forEach(a => {
      if (a.severity === 'Critical') criticalCount++;
      if (a.duration && a.duration > 300) longDurationCount++; // > 5 minutes

      const dayKey = a.startTime.toISOString().split('T')[0];
      if (!alertsByDay[dayKey]) alertsByDay[dayKey] = new Set();
      alertsByDay[dayKey].add(a.sensorType);
    });

    // Check for days where both HR and SpO2 had alerts (Compounding Risk)
    let compoundedDays = 0;
    Object.keys(alertsByDay).forEach(day => {
      const sensors = Array.from(alertsByDay[day]);
      if (sensors.includes('Heart Rate') && sensors.includes('SpO2')) {
        compoundedDays++;
      }
    });

    if (compoundedDays > 0) {
      insights.push({
        type: 'Risk',
        title: 'تقييم مخاطر مركب (متوسط-مرتفع)',
        description: `تم رصد ${compoundedDays} أيام حدث فيها اضطراب متزامن في (نبض القلب) و (نسبة الأكسجين). هذا التزامن يرفع من التقييم العام للمخاطر.`
      });
    }

    if (longDurationCount > 0) {
      insights.push({
        type: 'Risk',
        title: 'أحداث طويلة الأمد',
        description: `يوجد ${longDurationCount} تنبيهات استمرت لفترة تتجاوز 5 دقائق دون عودة المؤشرات لمستواها الطبيعي.`
      });
    }

    return insights;
  }

  static calculateHealthRiskScore(vitals, alerts) {
    if (vitals.length === 0) {
      return {
        type: 'RiskScore',
        title: 'التقييم الصحي العام',
        description: "Risk Score: 0/100 \nStatus: Low (No data)"
      };
    }

    let score = 0;

    // 1. Vital deviation (30 Points)
    // Check if latest vitals are out of baseline
    const recentVitals = vitals.slice(-5);
    const hrData = vitals.map(v => v.heartRate).filter(v => v != null && v > 0);
    const hrStats = this.calculateBaselineStats(hrData);
    
    let deviationScore = 0;
    if (hrStats.sd > 0 && recentVitals.length > 0) {
      const latestHr = recentVitals[recentVitals.length - 1].heartRate;
      if (latestHr > hrStats.avg + 2 * hrStats.sd || latestHr < hrStats.avg - 2 * hrStats.sd) {
        deviationScore += 15;
      }
      if (latestHr > hrStats.avg + 3 * hrStats.sd || latestHr < hrStats.avg - 3 * hrStats.sd) {
        deviationScore += 15; // 30 total
      }
    }
    score += deviationScore;

    // 2. Trend direction (20 Points)
    const recent48hVitals = vitals.filter(v => (new Date().getTime() - new Date(v.timestamp).getTime()) < 48 * 60 * 60 * 1000);
    if (recent48hVitals.length > 5) {
      const recentHR = recent48hVitals.map(v => v.heartRate).filter(v => v != null && v > 0);
      const hrSlope = this.calculateTrend(recentHR);
      if (hrSlope > 0.2) score += 20;
      else if (hrSlope > 0.1) score += 10;
    }

    // 3. Duration of abnormality (20 Points)
    const longAlerts = alerts.filter(a => a.duration > 300); // > 5 mins
    if (longAlerts.length > 2) score += 20;
    else if (longAlerts.length > 0) score += 10;

    // 4. Number of alerts (15 Points)
    const last24hAlerts = alerts.filter(a => (new Date().getTime() - a.startTime.getTime()) < 24 * 60 * 60 * 1000);
    if (last24hAlerts.length > 5) score += 15;
    else if (last24hAlerts.length > 2) score += 7;

    // 5. Data reliability (15 Points)
    // If there are many sensor errors/disconnections, it ADDS to risk because the patient is unmonitored properly, OR we can reduce the confidence. 
    // In many medical contexts, poor reliability = higher risk assumption for safety.
    const disconnections = vitals.filter(v => v.deviceStatus === 'disconnected' || v.deviceStatus === 'error');
    if (disconnections.length > 10) score += 15;

    // Cap score at 100
    score = Math.min(score, 100);

    // Determine Status
    let status = 'Low';
    if (score >= 76) status = 'Critical';
    else if (score >= 51) status = 'High';
    else if (score >= 26) status = 'Medium';

    return {
      type: 'RiskScore',
      title: 'مؤشر الخطورة الصحي',
      description: `Risk Score: ${score}/100\nStatus: ${status}`
    };
  }

  static interpretEvents(alerts, notes) {
    const insights = [];
    if (notes.length === 0 || alerts.length === 0) return insights;

    let correlatedCount = 0;
    const sequences = new Set(); // to prevent duplicate sequence texts

    notes.forEach(note => {
      const noteTime = note.eventTime.getTime();
      const thirtyMins = 30 * 60 * 1000;
      
      const relatedAlerts = alerts.filter(a => {
        const alertTime = a.startTime.getTime();
        return Math.abs(alertTime - noteTime) <= thirtyMins;
      });

      if (relatedAlerts.length > 0) {
        correlatedCount++;
        
        // Detect Sequential Meaningful Correlations
        relatedAlerts.forEach(alert => {
          const alertTime = alert.startTime.getTime();
          if (noteTime < alertTime) { // Symptom occurred BEFORE the vital drop/spike
            let actionText = alert.sensorType === 'SpO2' ? 'drop' : 'spike';
            if (alert.sensorType === 'Body Temperature') actionText = 'change';
            
            const sequenceText = `Symptoms occur before ${alert.sensorType} ${actionText}`;
            sequences.add(sequenceText);
          }
        });
      }
    });

    if (sequences.size > 0) {
      Array.from(sequences).forEach(seq => {
        insights.push({
          type: 'Interpretation',
          title: 'تسلسل زمني للأعراض',
          description: seq
        });
      });
    } else if (correlatedCount > 0) {
      // Fallback if no specific sequence was found but they occurred at the same exact second
      insights.push({
        type: 'Interpretation',
        title: 'تطابق الأعراض مع القراءات',
        description: `تم إيجاد توافق بين الملاحظات التي دونها المريض والتغيرات الفعلية في الأجهزة الطبية في ${correlatedCount} حالات.`
      });
    }

    return insights;
  }

  static applyRoleFilters(insights, role) {
    let finalInsights = [...insights];

    // Predictive monitoring focus, strict guidelines: no medical instructions.
    if (role === 'patient') {
      finalInsights.push({
        title: 'الوعي المبكر',
        description: 'هذا النظام للمراقبة التنبؤية فقط. تم اكتشاف الأنماط الحالية لزيادة الوعي المبكر بالمخاطر المحتملة.'
      });
    } else if (role === 'companion') {
      finalInsights.push({
        title: 'مراقبة استباقية',
        description: 'يُرجى التركيز على التنبيهات والأحداث المتكررة للتدخل والمتابعة المبكرة للمريض.'
      });
    } else if (role === 'doctor') {
      finalInsights.push({
        title: 'ملخص تحليلي (Predictive)',
        description: 'تم رصد هذه الأنماط المتسلسلة والتنبؤات الزمنية بناءً على خوارزميات الذكاء لتقييم استقرار الحالة مستقبلاً.'
      });
    }

    // Keep top 7 insights to maintain concise structure
    return finalInsights.slice(0, 7);
  }
}

module.exports = IntelligenceEngine;
