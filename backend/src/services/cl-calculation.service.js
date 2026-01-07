// Cognitive Load Calculation Service
// Implements the CL-Index algorithm with normalization formulas
import config from '../config/env.js';

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Normalize Self-Report (SR) component
 * Formula: SR_norm = (PAAS - 1) / 8
 * Alternative with NASA-TLX: SR_norm = (Mental_Demand + Effort + Frustration) / 300
 *
 * @param {Object} srData - Self-report data
 * @returns {number} Normalized SR value (0-1)
 */
export function normalizeSR(srData) {
    // Handle null or undefined input
    if (!srData) {
        return null;
    }

    const { paas_score, nasa_tlx_mental_demand, nasa_tlx_effort, nasa_tlx_frustration } = srData;

    // Prefer PAAS if available
    if (paas_score !== null && paas_score !== undefined) {
        // PAAS scale: 1-9
        const normalized = (paas_score - 1) / 8;
        return clamp(normalized, 0, 1);
    }

    // Fall back to NASA-TLX if PAAS not available
    if (nasa_tlx_mental_demand !== null && nasa_tlx_effort !== null && nasa_tlx_frustration !== null) {
        // NASA-TLX scales: 0-100 each
        const sum = nasa_tlx_mental_demand + nasa_tlx_effort + nasa_tlx_frustration;
        const normalized = sum / 300;
        return clamp(normalized, 0, 1);
    }

    // If no self-report data available, return null
    return null;
}

/**
 * Normalize Performance (PF) component
 * Formula: PF_norm = (1 - Accuracy) + (ResponseTime - ExpectedTime) / ExpectedTime
 * Clamped to [0, 1]
 *
 * @param {Object} pfData - Performance data
 * @returns {number} Normalized PF value (0-1)
 */
export function normalizePF(pfData) {
    const { accuracy, response_time_ms, expected_time_ms } = pfData;

    // Accuracy is required
    if (accuracy === null || accuracy === undefined) {
        return null;
    }

    // Error component (1 - accuracy)
    const errorComponent = 1 - accuracy;

    // If we have timing data, include time pressure component
    if (response_time_ms !== null && expected_time_ms !== null && expected_time_ms > 0) {
        const timePressure = (response_time_ms - expected_time_ms) / expected_time_ms;
        const normalized = errorComponent + Math.max(0, timePressure);
        return clamp(normalized, 0, 1);
    }

    // Otherwise, use accuracy-only
    return clamp(errorComponent, 0, 1);
}

/**
 * Normalize Behavioral (BH) component
 * Formula: BH_norm = (min(HintRequests, MaxHints)/MaxHints +
 *                     min(PageRevisits, MaxRevisits)/MaxRevisits +
 *                     min(PauseDuration_mins, MaxPause)/MaxPause) / 3
 *
 * @param {Object} bhData - Behavioral data
 * @returns {number} Normalized BH value (0-1)
 */
export function normalizeBH(bhData) {
    const {
        hint_requests = 0,
        page_revisits = 0,
        pause_duration_ms = 0,
    } = bhData;

    // Get caps from config
    const MAX_HINTS = config.BEHAVIORAL_CAPS.MAX_HINTS;
    const MAX_REVISITS = config.BEHAVIORAL_CAPS.MAX_REVISITS;
    const MAX_PAUSE_MINS = config.BEHAVIORAL_CAPS.MAX_PAUSE_MINS;

    // Convert pause duration to minutes
    const pause_duration_mins = pause_duration_ms / (1000 * 60);

    // Normalize each component
    const hintComponent = Math.min(hint_requests, MAX_HINTS) / MAX_HINTS;
    const revisitComponent = Math.min(page_revisits, MAX_REVISITS) / MAX_REVISITS;
    const pauseComponent = Math.min(pause_duration_mins, MAX_PAUSE_MINS) / MAX_PAUSE_MINS;

    // Average of the three components
    const normalized = (hintComponent + revisitComponent + pauseComponent) / 3;

    return clamp(normalized, 0, 1);
}

/**
 * Normalize Physiological (PH) component
 * This is a placeholder for future implementation with camera/sensors
 * For now, returns a default value or processes simple data
 *
 * @param {Object} phData - Physiological data
 * @returns {number|null} Normalized PH value (0-1) or null
 */
export function normalizePH(phData) {
    // If no physiological data provided, return null
    if (!phData || Object.keys(phData).length === 0) {
        return null;
    }

    // Placeholder: If there's eye tracking, facial analysis, or heart rate data
    // For now, return a conservative neutral value
    // This will be implemented when camera integration is added
    const { eye_tracking_data, facial_analysis, heart_rate_data } = phData;

    if (eye_tracking_data || facial_analysis || heart_rate_data) {
        // Future: Implement actual normalization based on physiological signals
        // For now, return null to exclude from calculation
        return null;
    }

    return null;
}

/**
 * Calculate CL-Index from normalized components
 * Formula: CL_index = (W_SR × SR_norm) + (W_PF × PF_norm) + (W_BH × BH_norm) + (W_PH × PH_norm)
 *
 * @param {Object} normalizedData - Normalized component data
 * @returns {number} CL-Index value (0-1)
 */
export function calculateCLIndex(normalizedData) {
    const { sr_normalized, pf_normalized, bh_normalized, ph_normalized } = normalizedData;

    // Get weights from config
    let weights = {
        SR: config.CL_WEIGHTS.SR,
        PF: config.CL_WEIGHTS.PF,
        BH: config.CL_WEIGHTS.BH,
        PH: config.CL_WEIGHTS.PH,
    };

    // Track which components are available
    const availableComponents = [];
    const componentWeights = [];

    if (sr_normalized !== null && sr_normalized !== undefined) {
        availableComponents.push({ value: sr_normalized, weight: weights.SR });
        componentWeights.push(weights.SR);
    }

    if (pf_normalized !== null && pf_normalized !== undefined) {
        availableComponents.push({ value: pf_normalized, weight: weights.PF });
        componentWeights.push(weights.PF);
    }

    if (bh_normalized !== null && bh_normalized !== undefined) {
        availableComponents.push({ value: bh_normalized, weight: weights.BH });
        componentWeights.push(weights.BH);
    }

    if (ph_normalized !== null && ph_normalized !== undefined) {
        availableComponents.push({ value: ph_normalized, weight: weights.PH });
        componentWeights.push(weights.PH);
    }

    // Need at least 2 components (typically SR and PF minimum)
    if (availableComponents.length < 2) {
        throw new Error('Insufficient data: At least 2 components (SR, PF, BH, or PH) are required for CL calculation');
    }

    // Normalize weights to sum to 1.0 based on available components
    const weightSum = componentWeights.reduce((sum, w) => sum + w, 0);

    // Calculate weighted sum
    let clIndex = 0;
    for (const component of availableComponents) {
        const normalizedWeight = component.weight / weightSum;
        clIndex += component.value * normalizedWeight;
    }

    return clamp(clIndex, 0, 1);
}

/**
 * Determine CL category based on index value
 * Categories: 'low', 'optimal', 'high', 'overload'
 *
 * @param {number} clIndex - CL-Index value (0-1)
 * @returns {string} CL category
 */
export function determineCLCategory(clIndex) {
    const thresholds = config.CL_THRESHOLDS;

    if (clIndex <= thresholds.LOW) {
        return 'low';
    } else if (clIndex <= thresholds.OPTIMAL) {
        return 'optimal';
    } else if (clIndex <= thresholds.HIGH) {
        return 'high';
    } else {
        return 'overload';
    }
}

/**
 * Complete CL calculation pipeline
 * Takes raw measurement data and returns normalized components, CL-Index, and category
 *
 * @param {Object} measurementData - Raw measurement data
 * @returns {Object} Complete CL calculation result
 */
export function calculateCognitiveLoad(measurementData) {
    const {
        // Self-Report
        sr_paas_score,
        sr_nasa_tlx_mental_demand,
        sr_nasa_tlx_effort,
        sr_nasa_tlx_frustration,
        // Performance
        pf_accuracy,
        pf_response_time_ms,
        pf_expected_time_ms,
        // Behavioral
        bh_hint_requests,
        bh_page_revisits,
        bh_pause_duration_ms,
        // Physiological
        ph_eye_tracking_data,
        ph_facial_analysis,
        ph_heart_rate_data,
    } = measurementData;

    // Normalize each component
    const sr_normalized = normalizeSR({
        paas_score: sr_paas_score,
        nasa_tlx_mental_demand: sr_nasa_tlx_mental_demand,
        nasa_tlx_effort: sr_nasa_tlx_effort,
        nasa_tlx_frustration: sr_nasa_tlx_frustration,
    });

    const pf_normalized = normalizePF({
        accuracy: pf_accuracy,
        response_time_ms: pf_response_time_ms,
        expected_time_ms: pf_expected_time_ms,
    });

    const bh_normalized = normalizeBH({
        hint_requests: bh_hint_requests,
        page_revisits: bh_page_revisits,
        pause_duration_ms: bh_pause_duration_ms,
    });

    const ph_normalized = normalizePH({
        eye_tracking_data: ph_eye_tracking_data,
        facial_analysis: ph_facial_analysis,
        heart_rate_data: ph_heart_rate_data,
    });

    // Calculate CL-Index
    const cl_index = calculateCLIndex({
        sr_normalized,
        pf_normalized,
        bh_normalized,
        ph_normalized,
    });

    // Determine category
    const cl_category = determineCLCategory(cl_index);

    // Get weights used
    const weights = {
        weight_sr: config.CL_WEIGHTS.SR,
        weight_pf: config.CL_WEIGHTS.PF,
        weight_bh: config.CL_WEIGHTS.BH,
        weight_ph: config.CL_WEIGHTS.PH,
    };

    return {
        // Normalized components
        sr_normalized,
        pf_normalized,
        bh_normalized,
        ph_normalized,
        // Final result
        cl_index,
        cl_category,
        // Weights used
        ...weights,
    };
}

/**
 * Validate measurement data before calculation
 * @param {Object} data - Measurement data to validate
 * @returns {Object} Validation result with valid flag and errors
 */
export function validateMeasurementData(data) {
    const errors = [];

    // Check if we have at least one self-report method
    const hasPAAS = data.sr_paas_score !== null && data.sr_paas_score !== undefined;
    const hasNASA = (
        data.sr_nasa_tlx_mental_demand !== null &&
        data.sr_nasa_tlx_effort !== null &&
        data.sr_nasa_tlx_frustration !== null
    );

    if (!hasPAAS && !hasNASA) {
        errors.push('Self-report data required (PAAS or NASA-TLX)');
    }

    // Validate PAAS range
    if (hasPAAS && (data.sr_paas_score < 1 || data.sr_paas_score > 9)) {
        errors.push('PAAS score must be between 1 and 9');
    }

    // Validate NASA-TLX ranges
    if (hasNASA) {
        if (data.sr_nasa_tlx_mental_demand < 0 || data.sr_nasa_tlx_mental_demand > 100) {
            errors.push('NASA-TLX Mental Demand must be between 0 and 100');
        }
        if (data.sr_nasa_tlx_effort < 0 || data.sr_nasa_tlx_effort > 100) {
            errors.push('NASA-TLX Effort must be between 0 and 100');
        }
        if (data.sr_nasa_tlx_frustration < 0 || data.sr_nasa_tlx_frustration > 100) {
            errors.push('NASA-TLX Frustration must be between 0 and 100');
        }
    }

    // Check performance data
    if (data.pf_accuracy === null || data.pf_accuracy === undefined) {
        errors.push('Performance accuracy is required');
    } else if (data.pf_accuracy < 0 || data.pf_accuracy > 1) {
        errors.push('Accuracy must be between 0 and 1');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
