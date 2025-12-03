use crate::models::BalanceInfo;
use serde::Deserialize;
use std::collections::HashMap;

/// Factory.ai API 响应结构
#[derive(Debug, Deserialize)]
struct FactoryApiResponse {
    usage: Usage,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Usage {
    standard: StandardUsage,
    #[serde(rename = "endDate")]
    end_date: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StandardUsage {
    user_tokens: u64,
    total_allowance: u64,
    org_overage_used: u64,
    used_ratio: f64,
}

/// 查询单个 API Key 的余额
pub async fn check_balance(api_key: &str) -> Result<BalanceInfo, String> {
    log::info!(
        "开始查询余额，API Key: {}...",
        &api_key[..api_key.len().min(10)]
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| {
            log::error!("创建 HTTP 客户端失败: {}", e);
            format!("创建 HTTP 客户端失败: {}", e)
        })?;

    log::info!("发送请求到 Factory.ai API...");
    let response = client
        .get("https://app.factory.ai/api/organization/members/chat-usage")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("x-factory-client", "web-browser")
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| {
            log::error!("请求失败: {}", e);
            format!("请求失败: {}", e)
        })?;

    let status = response.status();
    log::info!("收到响应，状态码: {}", status);

    if status.as_u16() != 200 {
        let text = response.text().await.unwrap_or_default();
        log::error!("HTTP 错误 {}: {}", status, text);
        return Err(format!("HTTP {}: {}", status, text));
    }

    // 先获取响应文本用于调试
    let response_text = response.text().await.map_err(|e| {
        log::error!("读取响应文本失败: {}", e);
        format!("读取响应失败: {}", e)
    })?;

    log::info!("响应内容: {}", response_text);

    // 解析 JSON
    let api_response: FactoryApiResponse = serde_json::from_str(&response_text).map_err(|e| {
        log::error!("JSON 解析失败: {}，响应内容: {}", e, response_text);
        format!("解析响应失败: {}，原始响应: {}", e, response_text)
    })?;

    let usage = api_response.usage.standard;
    let remaining = usage.total_allowance.saturating_sub(usage.user_tokens);
    let percent_used = usage.used_ratio * 100.0;
    let exceeded = usage.used_ratio > 1.0;

    // 提取到期时间：endDate字段（Unix时间戳，毫秒）
    let expiry_date = api_response.usage.end_date.map(|timestamp| {
        // 将毫秒时间戳转换为ISO格式字符串
        use chrono::{TimeZone, Utc};
        let datetime = Utc.timestamp_millis_opt(timestamp).unwrap();
        datetime.to_rfc3339()
    });

    log::info!(
        "余额查询成功: 已用 {}, 总配额 {}, 剩余 {}",
        usage.user_tokens,
        usage.total_allowance,
        remaining
    );

    if let Some(ref expiry) = expiry_date {
        log::info!("到期时间: {}", expiry);
    }

    Ok(BalanceInfo {
        used: usage.user_tokens,
        allowance: usage.total_allowance,
        remaining,
        overage: usage.org_overage_used,
        used_ratio: usage.used_ratio,
        percent_used,
        exceeded,
        expiry_date,
    })
}

/// 批量查询 API Keys 的余额
pub async fn batch_check_balances(
    api_keys: Vec<String>,
) -> Result<HashMap<String, BalanceInfo>, String> {
    let mut results = HashMap::new();

    for (i, key) in api_keys.iter().enumerate() {
        match check_balance(key).await {
            Ok(balance) => {
                results.insert(key.clone(), balance);
            }
            Err(e) => {
                log::warn!("查询密钥 {} 余额失败: {}", key, e);
            }
        }

        // 延迟 200ms 避免请求过快
        if i < api_keys.len() - 1 {
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;
        }
    }

    Ok(results)
}
