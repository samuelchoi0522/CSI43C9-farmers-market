package com.csi43C9.baylor.farmers_market.dto.vendor;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Data Transfer Object (DTO) for returning category label information.
 * Maps to the category_labels table.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CategoryLabelDto {

    private Long id;
    private String name;

}
