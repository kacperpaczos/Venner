use std::collections::HashMap;

#[derive(Debug, Clone, Default)]
pub struct CssRule {
    pub selectors: Vec<String>,
    pub declarations: HashMap<String, String>,
}

pub fn parse_rules(css: &str) -> Vec<CssRule> {
    let mut out = Vec::new();
    let mut idx = 0usize;
    let bytes = css.as_bytes();

    while idx < bytes.len() {
        let start = match css[idx..].find('{') {
            Some(pos) => idx + pos,
            None => break,
        };
        let end = match find_matching_brace(css, start) {
            Some(pos) => pos,
            None => break,
        };

        let selector_text = css[idx..start].trim();
        if selector_text.is_empty() {
            idx = end + 1;
            continue;
        }

        let selectors = selector_text
            .split(',')
            .map(normalize_selector)
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>();
        if selectors.is_empty() {
            idx = end + 1;
            continue;
        }

        let declarations = parse_declarations(&css[start + 1..end]);
        out.push(CssRule {
            selectors,
            declarations,
        });

        idx = end + 1;
    }

    out
}

pub fn normalize_selector(input: &str) -> String {
    input
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .to_string()
}

pub fn selector_contains_all(selector: &str, parts: &[&str]) -> bool {
    parts.iter().all(|part| selector.contains(part))
}

pub fn first_prop_from_selectors(
    rules: &[CssRule],
    selector_fragments: &[&[&str]],
    prop: &str,
) -> Option<String> {
    for fragments in selector_fragments {
        for rule in rules {
            if rule
                .selectors
                .iter()
                .any(|s| selector_contains_all(s, fragments))
            {
                if let Some(v) = rule.declarations.get(prop) {
                    return Some(v.clone());
                }
            }
        }
    }
    None
}

pub fn collect_props_from_selectors(
    rules: &[CssRule],
    selector_fragments: &[&[&str]],
    props: &[&str],
) -> HashMap<String, String> {
    let mut out = HashMap::new();
    for prop in props {
        if let Some(value) = first_prop_from_selectors(rules, selector_fragments, prop) {
            out.insert((*prop).to_string(), value);
        }
    }
    out
}

fn parse_declarations(block: &str) -> HashMap<String, String> {
    let mut out = HashMap::new();

    for chunk in block.split(';') {
        let candidate = chunk.trim();
        if candidate.is_empty() || candidate.starts_with("/*") {
            continue;
        }
        let mut split = candidate.splitn(2, ':');
        let Some(name) = split.next() else {
            continue;
        };
        let Some(value) = split.next() else {
            continue;
        };
        let key = name.trim();
        let val = value.trim();
        if !key.is_empty() && !val.is_empty() {
            out.insert(key.to_string(), val.to_string());
        }
    }

    out
}

fn find_matching_brace(css: &str, open_idx: usize) -> Option<usize> {
    let mut depth = 0i32;
    let mut in_string = false;
    let mut string_char = '\0';
    let chars = css.as_bytes();

    for (i, b) in chars.iter().enumerate().skip(open_idx) {
        let c = *b as char;
        if in_string {
            if c == string_char {
                in_string = false;
            }
            continue;
        }
        if c == '"' || c == '\'' {
            in_string = true;
            string_char = c;
            continue;
        }
        if c == '{' {
            depth += 1;
        } else if c == '}' {
            depth -= 1;
            if depth == 0 {
                return Some(i);
            }
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::{first_prop_from_selectors, parse_rules};

    #[test]
    fn parses_selector_order_independently() {
        let css = r#"
.titlebar:not(headerbar), headerbar { min-height: 46px; }
windowcontrols button > image { border-radius: 9999px; }
"#;
        let rules = parse_rules(css);
        assert_eq!(
            first_prop_from_selectors(
                &rules,
                &[&["headerbar"], &[".titlebar:not(headerbar)"]],
                "min-height"
            )
            .as_deref(),
            Some("46px")
        );
        assert_eq!(
            first_prop_from_selectors(
                &rules,
                &[&["windowcontrols", "button", "> image"]],
                "border-radius"
            )
            .as_deref(),
            Some("9999px")
        );
    }
}
