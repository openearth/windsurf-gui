$.widget( "ui.dynamicaccordion", {
    
    version: "0.0.1",
    
    options: {
	buttons: ["add"],
        title: "item",
        editable: false,
        add: null
    },
    
    _create: function() {
        var p = this;
        
        $(this.element)
            .addClass("ui-dynamicaccordion")
        
        var buttons = $("<div />")
            .addClass("ui-dynamicaccordion-buttons")

        $.each(this.options.buttons, function() {
            $(buttons)
                .append(
                    $("<div />")
                        .text(
                            this
                        )
                        .button({
                            icons: {
                                primary: "ui-icon-plus"
                            }
                        })
                        .click(function() {
                            p.add_item(
                                $(this).text()
                            );
                        })
                )
        });

        var accordion = $("<div />")
            .accordion(this.options.accordion);
        
        $(this.element)
            .append(buttons)
            .append(accordion);
        
    },
    
    add_item: function(type) {
        var p = this;

        var header = $("<h3 />")
            .append(
                $("<span />")
                    .addClass("ui-dynamicaccordion-title")
                    .attr("contenteditable", this.options.editable?"true":"false")
                    .text(
                        this.options.title==null?type:this.options.title
                    )
            )
            .append(
                $("<div />")
                    .button({
                        icons: {
                            primary: "ui-icon-trash"
                        },
                        text: false
                    })
                    .click(function() {
                        p.remove_item(
                            $(this).parent()
                        );
                    })
            );

        var body = $("<div />")
        
        $(this.element)
            .children(".ui-accordion")
            .append(header)
            .append(body);

        if (this._isfunction(this.options.add)) {
            this.options.add(
                $(this.element)
                    .children(".ui-accordion")
                    .children(":last"),
                type
            );
        }

        this.refresh();
        
        $(this.element)
            .children(".ui-accordion")
            .accordion("option", "active", -1);
    },

    remove_item: function(obj) {
        var p = this;

        $(obj)
            .next()
            .remove();
        $(obj)
            .remove();
    },

    refresh: function() {
        $(this.element)
            .children(".ui-accordion")
            .accordion("refresh");
    },

    _isfunction: function(fcn) {
        var getType = {};
        return fcn && getType.toString.call(fcn) === '[object Function]';
    }

});

